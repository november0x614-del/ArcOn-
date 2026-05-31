// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error PriceMustBeAboveZero();
error NotApprovedForMarketplace();
error AlreadyListed(address nftAddress, uint256 tokenId);
error NotOwner();
error NotListed(address nftAddress, uint256 tokenId);
error PriceNotMet(address nftAddress, uint256 tokenId, uint256 price);
error TransferFailed();

/**
 * @title LoungeNFTMarket
 * @dev Kontrak cerdas (Smart Contract) untuk Marketplace NFT Native Arc Network
 * Mendukung fungsi pendaftaran (Listing), pembatalan, dan pembelian menggunakan gas token native (berbasis USDC).
 */
contract LoungeNFTMarket is ReentrancyGuard, Ownable {
    struct Listing {
        uint256 price;
        address seller;
    }

    // State Variables
    // Format: nftContractAddress => tokenId => Listing
    mapping(address => mapping(uint256 => Listing)) private s_listings;
    
    // Konfigurasi Biaya Platform (Platform Fee) dalam persentase (misal 2 = 2%)
    uint256 private s_marketFeePercentage = 2; 
    address private s_feeRecipient;

    // Events
    event ItemListed(address indexed seller, address indexed nftAddress, uint256 indexed tokenId, uint256 price);
    event ItemCanceled(address indexed seller, address indexed nftAddress, uint256 indexed tokenId);
    event ItemBought(address indexed buyer, address indexed nftAddress, uint256 indexed tokenId, uint256 price);
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
    event MarketFeeUpdated(uint256 oldFee, uint256 newFee);

    // Modifiers
    modifier notListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price > 0) {
            revert AlreadyListed(nftAddress, tokenId);
        }
        _;
    }

    modifier isOwner(address nftAddress, uint256 tokenId, address spender) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (spender != owner) {
            revert NotOwner();
        }
        _;
    }

    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price == 0) {
            revert NotListed(nftAddress, tokenId);
        }
        _;
    }

    /**
     * @dev Constructor menerima alamat penerima komisi platform (treasury)
     * @param feeRecipient Alamat dompet admin/treasury
     */
    constructor(address feeRecipient) Ownable(msg.sender) {
        s_feeRecipient = feeRecipient;
    }

    /**
     * @notice Mendaftarkan NFT untuk dijual di Marketplace
     * @param nftAddress Alamat kontrak ERC721
     * @param tokenId ID Token dari NFT
     * @param price Harga jual yang diinginkan (dalam satuan Wei/minimum unit native token)
     */
    function listNFT(address nftAddress, uint256 tokenId, uint256 price)
        external
        notListed(nftAddress, tokenId)
        isOwner(nftAddress, tokenId, msg.sender)
    {
        if (price == 0) {
            revert PriceMustBeAboveZero();
        }

        IERC721 nft = IERC721(nftAddress);
        
        // Memastikan Marketplace telah diberikan persetujuan (approval) oleh pemilik NFT
        if (nft.getApproved(tokenId) != address(this) && !nft.isApprovedForAll(msg.sender, address(this))) {
            revert NotApprovedForMarketplace();
        }

        s_listings[nftAddress][tokenId] = Listing(price, msg.sender);
        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    /**
     * @notice Membeli NFT yang sedang didaftarkan
     * @dev Memerlukan pembayaran `msg.value` yang mencukupi atau sama dengan harga listing
     * @param nftAddress Alamat kontrak ERC721
     * @param tokenId ID Token dari NFT
     */
    function buyNFT(address nftAddress, uint256 tokenId)
        external
        payable
        nonReentrant
        isListed(nftAddress, tokenId)
    {
        Listing memory listedItem = s_listings[nftAddress][tokenId];
        if (msg.value < listedItem.price) {
            revert PriceNotMet(nftAddress, tokenId, listedItem.price);
        }

        // Kalkulasi pembagian komisi 
        uint256 fee = (msg.value * s_marketFeePercentage) / 100;
        uint256 sellerProceeds = msg.value - fee;

        // Hapus status listing untuk mencegah "Double Spend" / "Reentrancy" tambahan
        delete (s_listings[nftAddress][tokenId]);
        
        // Transfer hasil penjualan ke pemilik asli
        (bool success, ) = payable(listedItem.seller).call{value: sellerProceeds}("");
        if (!success) revert TransferFailed();

        // Transfer komisi ke platform (jika ada)
        if (fee > 0 && s_feeRecipient != address(0)) {
            (bool feeSuccess, ) = payable(s_feeRecipient).call{value: fee}("");
            if (!feeSuccess) revert TransferFailed();
        }

        // Serahkan aset NFT ke pembeli
        IERC721(nftAddress).safeTransferFrom(listedItem.seller, msg.sender, tokenId);
        emit ItemBought(msg.sender, nftAddress, tokenId, listedItem.price);
    }

    /**
     * @notice Membatalkan listing dari NFT
     * @dev Hanya dapat dipanggil oleh pemilik asli NFT tersebut
     * @param nftAddress Alamat kontrak ERC721
     * @param tokenId ID Token dari NFT
     */
    function cancelListing(address nftAddress, uint256 tokenId)
        external
        isOwner(nftAddress, tokenId, msg.sender)
        isListed(nftAddress, tokenId)
    {
        delete (s_listings[nftAddress][tokenId]);
        emit ItemCanceled(msg.sender, nftAddress, tokenId);
    }

    /**
     * @notice Mengubah dompet penerima platform fee (Hanya Owner)
     * @param newRecipient Alamat dompet treasury baru
     */
    function setFeeRecipient(address newRecipient) external onlyOwner {
        address oldRecipient = s_feeRecipient;
        s_feeRecipient = newRecipient;
        emit FeeRecipientUpdated(oldRecipient, newRecipient);
    }

    /**
     * @notice Mengubah persentase fee platform (Hanya Owner)
     * @param newFee Persentase biaya (contoh: 2 untuk 2%)
     */
    function setMarketFeePercentage(uint256 newFee) external onlyOwner {
        uint256 oldFee = s_marketFeePercentage;
        s_marketFeePercentage = newFee;
        emit MarketFeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Mengambil data listing dari sebuah NFT
     * @param nftAddress Alamat kontrak ERC721
     * @param tokenId ID Token dari NFT
     * @return Listing Struktur data listing yang meliputi harga dan alamat penjual
     */
    function getListing(address nftAddress, uint256 tokenId) external view returns (Listing memory) {
        return s_listings[nftAddress][tokenId];
    }
}
