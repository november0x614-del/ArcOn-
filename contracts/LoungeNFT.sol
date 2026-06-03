// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LoungeNFT
 * @dev NFT Certificate for items sold on Lounge Marketplace (Arc Network)
 */
contract LoungeNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    event NFTMinted(address indexed to, uint256 indexed tokenId, string uri);

    constructor() ERC721("Lounge Marketplace Certificate", "L-NFT") Ownable(msg.sender) {}

    /**
     * @dev Mint a new NFT receipt for a merchant product
     * @param to The address of the merchant/buyer depending on flow
     * @param uri Metadata URI (JSON)
     */
    function mint(address to, string memory uri) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        emit NFTMinted(to, tokenId, uri);
        return tokenId;
    }

    /**
     * @dev Simple burn function
     */
    function burn(uint256 tokenId) public {
        _update(address(0), tokenId, _msgSender());
    }
}
