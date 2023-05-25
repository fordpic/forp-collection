// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IWhitelist.sol";

contract Forps is ERC721Enumerable, Ownable {
    // Public Variables
    string _baseTokenURI;
    bool public _paused;
    bool public presaleStarted;
    uint256 public _price;
    uint256 public tokenIds;
    uint256 public maxTokenIds = 20;
    uint256 public presaleEnded;

    IWhitelist whitelist;

    modifier onlyWhenNotPaused() {
        require(!_paused, "Contract is currently paused");
        _;
    }

    constructor(
        string memory baseURI,
        address whitelistContract
    ) ERC721("Forps", "FP") {
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whitelistContract);
    }

    // Functions
    function startPresale() public onlyOwner {
        presaleStarted = true;

        // Set 5 min presale end time
        presaleEnded = block.timestamp + 5 minutes;
    }

    function presaleMint() public payable onlyWhenNotPaused {
        require(
            presaleStarted && block.timestamp < presaleEnded,
            "Presale is not running currently"
        );
        require(
            whitelist.whitelistedAddresses(msg.sender),
            "You are not on the whitelist"
        );
        require(tokenIds < maxTokenIds, "Exceeded maximum Forps supply");
        require(msg.value >= _price, "Must send correct amount of Ether");

        tokenIds++;
        _safeMint(msg.sender, tokenIds);
    }

    function mint() public payable onlyWhenNotPaused {
        require(
            presaleStarted && block.timestamp >= presaleEnded,
            "Presale has not ended yet"
        );
        require(tokenIds < maxTokenIds, "Exceeded maximum Forps supply");
        require(msg.value >= _price, "Must send correct amount of Ether");

        tokenIds++;
        _safeMint(msg.sender, tokenIds);
    }

    // Have to have to override the default baseURI returned by OZ
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function setPaused(bool val) public onlyOwner {
        _paused = val;
    }

    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;

        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }

    // Needed for contract to receive ETH
    receive() external payable {}

    fallback() external payable {}
}
