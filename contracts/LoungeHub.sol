// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LoungeHub
 * @dev Mengelola pembayaran e-commerce native USDC di Arc Network
 * User-rules: Logic ini dioperasikan di server-side via Circle SDK
 */
contract LoungeHub is Ownable, ReentrancyGuard {
    IERC20 public immutable usdc;
    uint256 public platformFeeBps = 150; // 1.5% Fee
    address public treasury;

    struct Order {
        address buyer;
        address merchant;
        uint256 amount;
        uint256 platformFee;
        bool settled;
    }

    mapping(bytes32 => Order) public orders;

    event OrderCreated(bytes32 indexed orderId, address buyer, uint256 amount);
    event SettlementExecuted(bytes32 indexed orderId, uint256 merchantAmount, uint256 platformFee);

    constructor(address _usdc, address _treasury) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        treasury = _treasury;
    }

    function setPlatformFee(uint256 _newFee) external onlyOwner {
        platformFeeBps = _newFee;
    }

    function purchase(bytes32 orderId, uint256 price, address merchant) external nonReentrant {
        uint256 fee = (price * platformFeeBps) / 10000;
        uint256 total = price + fee;

        require(usdc.transferFrom(msg.sender, address(this), total), "Transfer Failed");

        orders[orderId] = Order({
            buyer: msg.sender,
            merchant: merchant,
            amount: price,
            platformFee: fee,
            settled: false
        });

        emit OrderCreated(orderId, msg.sender, price);
    }

    function finalize(bytes32 orderId) external onlyOwner {
        Order storage order = orders[orderId];
        require(!order.settled, "Settled");
        order.settled = true;
        
        usdc.transfer(order.merchant, order.amount);
        usdc.transfer(treasury, order.platformFee);
        
        emit SettlementExecuted(orderId, order.amount, order.platformFee);
    }
}
