// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PlanetTrading
 * @dev Smart contract for trading planet ownership NFTs
 * @notice This contract handles the trading of planet ownership certificates as NFTs
 */
contract PlanetTrading {
    // Structs
    struct PlanetListing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool isActive;
        uint256 createdAt;
    }

    struct TradeOffer {
        uint256 listingId;
        address buyer;
        uint256 offerPrice;
        bool isActive;
        uint256 createdAt;
    }

    // State variables
    mapping(uint256 => PlanetListing) public listings;
    mapping(uint256 => TradeOffer[]) public tradeOffers;
    mapping(address => uint256[]) public userListings;
    
    uint256 public listingCounter;
    uint256 public tradeFee = 250; // 2.5% (basis points)
    address public owner;
    address public feeRecipient;

    // Events
    event PlanetListed(uint256 indexed listingId, uint256 indexed tokenId, address indexed seller, uint256 price);
    event ListingCancelled(uint256 indexed listingId);
    event TradeOfferCreated(uint256 indexed listingId, uint256 indexed offerId, address indexed buyer, uint256 offerPrice);
    event TradeExecuted(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 price);
    event TradeOfferCancelled(uint256 indexed listingId, uint256 indexed offerId);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier listingExists(uint256 listingId) {
        require(listings[listingId].isActive, "Listing does not exist or is inactive");
        _;
    }

    constructor(address _feeRecipient) {
        owner = msg.sender;
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev List a planet NFT for sale
     * @param tokenId The NFT token ID
     * @param price The asking price in wei
     */
    function listPlanet(uint256 tokenId, uint256 price) external returns (uint256) {
        require(price > 0, "Price must be greater than 0");
        
        listingCounter++;
        listings[listingCounter] = PlanetListing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            isActive: true,
            createdAt: block.timestamp
        });

        userListings[msg.sender].push(listingCounter);

        emit PlanetListed(listingCounter, tokenId, msg.sender, price);
        return listingCounter;
    }

    /**
     * @dev Cancel a listing
     * @param listingId The listing ID to cancel
     */
    function cancelListing(uint256 listingId) external listingExists(listingId) {
        require(listings[listingId].seller == msg.sender, "Not the seller");
        listings[listingId].isActive = false;
        emit ListingCancelled(listingId);
    }

    /**
     * @dev Create a trade offer
     * @param listingId The listing ID
     * @param offerPrice The offer price in wei
     */
    function createTradeOffer(uint256 listingId, uint256 offerPrice) external payable listingExists(listingId) {
        require(msg.sender != listings[listingId].seller, "Cannot offer on own listing");
        require(offerPrice > 0, "Offer price must be greater than 0");
        require(msg.value >= offerPrice, "Insufficient payment");

        uint256 offerId = tradeOffers[listingId].length;
        tradeOffers[listingId].push(TradeOffer({
            listingId: listingId,
            buyer: msg.sender,
            offerPrice: offerPrice,
            isActive: true,
            createdAt: block.timestamp
        }));

        emit TradeOfferCreated(listingId, offerId, msg.sender, offerPrice);
    }

    /**
     * @dev Accept a trade offer
     * @param listingId The listing ID
     * @param offerId The offer ID to accept
     */
    function acceptTradeOffer(uint256 listingId, uint256 offerId) external listingExists(listingId) {
        require(listings[listingId].seller == msg.sender, "Not the seller");
        require(offerId < tradeOffers[listingId].length, "Invalid offer ID");
        
        TradeOffer storage offer = tradeOffers[listingId][offerId];
        require(offer.isActive, "Offer is not active");

        address buyer = offer.buyer;
        uint256 price = offer.offerPrice;

        // Mark listing and offer as inactive
        listings[listingId].isActive = false;
        offer.isActive = false;

        // Calculate fees
        uint256 fee = (price * tradeFee) / 10000;
        uint256 sellerAmount = price - fee;

        // Transfer funds
        payable(listings[listingId].seller).transfer(sellerAmount);
        payable(feeRecipient).transfer(fee);

        // Refund excess if any
        if (msg.value > 0) {
            payable(buyer).transfer(msg.value);
        }

        emit TradeExecuted(listingId, buyer, msg.sender, price);
    }

    /**
     * @dev Cancel a trade offer
     * @param listingId The listing ID
     * @param offerId The offer ID to cancel
     */
    function cancelTradeOffer(uint256 listingId, uint256 offerId) external {
        require(offerId < tradeOffers[listingId].length, "Invalid offer ID");
        TradeOffer storage offer = tradeOffers[listingId][offerId];
        require(offer.buyer == msg.sender, "Not the offer creator");
        require(offer.isActive, "Offer is not active");

        offer.isActive = false;
        
        // Refund the buyer
        payable(msg.sender).transfer(offer.offerPrice);

        emit TradeOfferCancelled(listingId, offerId);
    }

    /**
     * @dev Buy a planet directly at listing price
     * @param listingId The listing ID
     */
    function buyPlanet(uint256 listingId) external payable listingExists(listingId) {
        PlanetListing storage listing = listings[listingId];
        require(msg.value >= listing.price, "Insufficient payment");

        address seller = listing.seller;
        uint256 price = listing.price;

        // Mark listing as inactive
        listing.isActive = false;

        // Calculate fees
        uint256 fee = (price * tradeFee) / 10000;
        uint256 sellerAmount = price - fee;

        // Transfer funds
        payable(seller).transfer(sellerAmount);
        payable(feeRecipient).transfer(fee);

        // Refund excess if any
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }

        emit TradeExecuted(listingId, msg.sender, seller, price);
    }

    /**
     * @dev Get all listings for a user
     * @param user The user address
     * @return An array of listing IDs
     */
    function getUserListings(address user) external view returns (uint256[] memory) {
        return userListings[user];
    }

    /**
     * @dev Get all trade offers for a listing
     * @param listingId The listing ID
     * @return An array of trade offers
     */
    function getTradeOffers(uint256 listingId) external view returns (TradeOffer[] memory) {
        return tradeOffers[listingId];
    }

    /**
     * @dev Update trade fee (owner only)
     * @param newFee The new fee in basis points (e.g., 250 = 2.5%)
     */
    function setTradeFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee cannot exceed 10%");
        tradeFee = newFee;
    }

    /**
     * @dev Update fee recipient (owner only)
     * @param newRecipient The new fee recipient address
     */
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid address");
        feeRecipient = newRecipient;
    }

    /**
     * @dev Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}

