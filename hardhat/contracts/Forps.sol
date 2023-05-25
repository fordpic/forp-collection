// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IWhitelist.sol";

contract Forps is ERC721Enumberable, Ownable {
    string _baseTokenURI;
    bool public _paused;
    uint256 public _price;
    uint256 public tokenIds;
    uint256 public maxTokenIds = 20;

    IWhitelist whitelist;

    uint256 public presaleEnded;

    modifier onlyWhenNotPaused() {
        require(!_paused, "Contract is currently paused");
    }

    constructor(
        string memory baseURI,
        address whitelistContract
    ) ERC721("Forps", "FP") {
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whitelistContract);
    }
}
