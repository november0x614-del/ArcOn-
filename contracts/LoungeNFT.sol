// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LoungeNFT
 * @dev Kontrak ERC-721 sederhana yang memiliki kemampuan `mintTo` sehingga 
 * platform atau admin bisa melakukan pencetakan NFT untuk pengguna.
 */
contract LoungeNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    event NFTMinted(address indexed recipient, uint256 indexed tokenId, string tokenUri);

    /**
     * @param initialOwner Address dari deployer/admin yang mengontrol contract ini.
     * Untuk project kita, ini biasanya dompet "Platform Treasury" atau "Admin Wallet".
     */
    constructor(address initialOwner) ERC721("Lounge NFT", "LNFT") Ownable(initialOwner) {}

    /**
     * @notice Mencetak (mint) NFT baru ke alamat dompet tertentu
     * @param to Alamat wallet yang menerima NFT
     * @param uri Metadata URI (IPFS link) untuk NFT ini
     */
    function mintTo(address to, string memory uri) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        emit NFTMinted(to, tokenId, uri);
        
        return tokenId;
    }
}
