// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error Escrow__InvalidAmount();
error Escrow__InvalidState();
error Escrow__NotAuthorized();
error Escrow__TransferFailed();

/**
 * @title LoungeRWAEscrow
 * @dev Kontrak Escrow untuk transaksi E-Commerce Real World Assets (RWA) / Barang Fisik.
 * Mengunci dana pembeli hingga barang fisik dikonfirmasi diterima atau diteruskan melalui sistem resolusi.
 */
contract LoungeRWAEscrow is ReentrancyGuard, Ownable {
    enum OrderState { AWAITING_SHIPMENT, SHIPPED, COMPLETED, DISPUTED, REFUNDED }

    struct Order {
        address buyer;
        address seller;
        uint256 amount;
        OrderState state;
        string productId; // Referensi ID pesanan/produk off-chain (dari Supabase)
    }

    uint256 public s_orderCounter;
    mapping(uint256 => Order) public s_orders;

    // Persentase Biaya Platform (misal 2 = 2%)
    uint256 private s_platformFeePercent = 2;
    address private s_treasury;

    // Events untuk mendengarkan perubahan status dari off-chain (Circle Webhooks/Subgraphs)
    event OrderCreated(uint256 indexed orderId, address indexed buyer, address indexed seller, uint256 amount, string productId);
    event OrderShipped(uint256 indexed orderId);
    event OrderCompleted(uint256 indexed orderId, address indexed seller, uint256 netAmount, uint256 fee);
    event OrderDisputed(uint256 indexed orderId);
    event OrderRefunded(uint256 indexed orderId, address indexed buyer);

    modifier onlyBuyer(uint256 orderId) {
        if (msg.sender != s_orders[orderId].buyer) revert Escrow__NotAuthorized();
        _;
    }

    modifier onlySellerOrAdmin(uint256 orderId) {
        if (msg.sender != s_orders[orderId].seller && msg.sender != owner()) revert Escrow__NotAuthorized();
        _;
    }

    constructor(address treasury) Ownable(msg.sender) {
        s_treasury = treasury;
    }

    /**
     * @notice 1. Pembeli membuat order dan mengunci dana native (USDC) di Smart Contract.
     */
    function createOrder(address seller, string memory productId) external payable nonReentrant {
        if (msg.value <= 0) revert Escrow__InvalidAmount();

        s_orderCounter++;
        uint256 newOrderId = s_orderCounter;

        s_orders[newOrderId] = Order({
            buyer: msg.sender,
            seller: seller,
            amount: msg.value,
            state: OrderState.AWAITING_SHIPMENT,
            productId: productId
        });

        emit OrderCreated(newOrderId, msg.sender, seller, msg.value, productId);
    }

    /**
     * @notice 2. Penjual (atau Sistem/Admin via Webhook) merubah status ketika barang dikirim.
     */
    function markAsShipped(uint256 orderId) external onlySellerOrAdmin(orderId) {
        Order storage order = s_orders[orderId];
        if (order.state != OrderState.AWAITING_SHIPMENT) revert Escrow__InvalidState();

        order.state = OrderState.SHIPPED;
        emit OrderShipped(orderId);
    }

    /**
     * @notice 3. Pembeli memverifikasi barang tiba. Dana di-release secara otomatis ke penjual dan treasury.
     */
    function confirmReceipt(uint256 orderId) external onlyBuyer(orderId) nonReentrant {
        Order storage order = s_orders[orderId];
        if (order.state != OrderState.SHIPPED) revert Escrow__InvalidState();

        order.state = OrderState.COMPLETED;

        uint256 fee = (order.amount * s_platformFeePercent) / 100;
        uint256 sellerProceeds = order.amount - fee;

        (bool successSeller, ) = payable(order.seller).call{value: sellerProceeds}("");
        if (!successSeller) revert Escrow__TransferFailed();

        if (fee > 0 && s_treasury != address(0)) {
            (bool successFee, ) = payable(s_treasury).call{value: fee}("");
            if (!successFee) revert Escrow__TransferFailed();
        }

        emit OrderCompleted(orderId, order.seller, sellerProceeds, fee);
    }

    /**
     * @notice Fitur Dispute (Sengketa) jika ada masalah (barang rusak/tidak sampai).
     */
    function raiseDispute(uint256 orderId) external {
        Order storage order = s_orders[orderId];
        if (msg.sender != order.buyer && msg.sender != order.seller) revert Escrow__NotAuthorized();
        if (order.state == OrderState.COMPLETED || order.state == OrderState.REFUNDED) revert Escrow__InvalidState();

        order.state = OrderState.DISPUTED;
        emit OrderDisputed(orderId);
    }

    /**
     * @notice Admin memberikan resolusi: Refund uang ke pembeli ATAU tetapkan selesai (bayar penjual).
     */
    function resolveDispute(uint256 orderId, bool refundBuyer) external onlyOwner nonReentrant {
        Order storage order = s_orders[orderId];
        if (order.state != OrderState.DISPUTED) revert Escrow__InvalidState();

        if (refundBuyer) {
            order.state = OrderState.REFUNDED;
            (bool success, ) = payable(order.buyer).call{value: order.amount}("");
            if (!success) revert Escrow__TransferFailed();
            emit OrderRefunded(orderId, order.buyer);
        } else {
            order.state = OrderState.COMPLETED;
            uint256 fee = (order.amount * s_platformFeePercent) / 100;
            uint256 sellerProceeds = order.amount - fee;

            (bool successSeller, ) = payable(order.seller).call{value: sellerProceeds}("");
            if (!successSeller) revert Escrow__TransferFailed();

            if (fee > 0 && s_treasury != address(0)) {
                (bool successFee, ) = payable(s_treasury).call{value: fee}("");
                if (!successFee) revert Escrow__TransferFailed();
            }
            emit OrderCompleted(orderId, order.seller, sellerProceeds, fee);
        }
    }
}
