// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ProjectEscrow
 * @dev Escrow contract for decentralized crowdfunding with milestone-based fund release
 */
contract ProjectEscrow {
    address public relayer;
    address public projectCreator;
    uint256 public targetAmount;
    uint256 public totalDeposited;
    uint256 public totalReleased;
    bool public campaignActive;
    
    struct Milestone {
        uint256 amount;
        bool released;
        string description;
    }
    
    Milestone[] public milestones;
    
    mapping(address => uint256) public contributions;
    address[] public contributors;
    
    event DonationReceived(address indexed contributor, uint256 amount, uint256 timestamp);
    event MilestoneReleased(uint256 indexed milestoneId, uint256 amount, address indexed recipient);
    event CampaignClosed(uint256 totalRaised, uint256 timestamp);
    event DirectEthReceived(address indexed sender, uint256 amount, uint256 timestamp);
    
    modifier onlyRelayer() {
        require(msg.sender == relayer, "Only relayer can call this");
        _;
    }
    
    modifier campaignIsActive() {
        require(campaignActive, "Campaign is not active");
        _;
    }
    
    constructor(
        address _projectCreator,
        uint256 _targetAmount
    ) {
        relayer = msg.sender;
        projectCreator = _projectCreator;
        targetAmount = _targetAmount;
        campaignActive = true;
    }
    
    /**
     * @dev Accept plain ETH transfers (e.g., from relayer via sendTransaction)
     * This allows flexible donation mechanisms
     */
    receive() external payable campaignIsActive {
        require(msg.value > 0, "Donation must be greater than 0");
        
        // Track contribution from sender (usually the relayer)
        // This is used when sending ETH directly instead of via depositForDonor
        if (contributions[msg.sender] == 0) {
            contributors.push(msg.sender);
        }
        contributions[msg.sender] += msg.value;
        totalDeposited += msg.value;
        
        emit DirectEthReceived(msg.sender, msg.value, block.timestamp);
    }
    
    /**
     * @dev Relayer deposits funds on behalf of donors
     * @param _donor Address of the actual donor
     */
    function depositForDonor(address _donor) external payable onlyRelayer campaignIsActive {
        require(msg.value > 0, "Donation must be greater than 0");
        require(_donor != address(0), "Invalid donor address");
        
        if (contributions[_donor] == 0) {
            contributors.push(_donor);
        }
        
        contributions[_donor] += msg.value;
        totalDeposited += msg.value;
        
        emit DonationReceived(_donor, msg.value, block.timestamp);
    }
    
    /**
     * @dev Fallback function to handle any unexpected calls
     */
    fallback() external payable {
        // If someone sends ETH with data, we'll accept it
        if (campaignActive && msg.value > 0) {
            if (contributions[msg.sender] == 0) {
                contributors.push(msg.sender);
            }
            contributions[msg.sender] += msg.value;
            totalDeposited += msg.value;
            emit DirectEthReceived(msg.sender, msg.value, block.timestamp);
        }
    }
    
    /**
     * @dev Release funds for a specific milestone
     * @param milestoneId Index of the milestone
     * @param amount Amount to release
     */
    function releaseMilestoneFunds(uint256 milestoneId, uint256 amount) external onlyRelayer {
        require(milestoneId < milestones.length, "Invalid milestone ID");
        require(!milestones[milestoneId].released, "Milestone already released");
        require(amount <= (totalDeposited - totalReleased), "Insufficient funds");
        
        milestones[milestoneId].released = true;
        totalReleased += amount;
        
        (bool success, ) = projectCreator.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit MilestoneReleased(milestoneId, amount, projectCreator);
    }
    
    /**
     * @dev Add a new milestone (called by relayer based on off-chain proposal)
     * @param amount Amount for this milestone
     * @param description Milestone description
     */
    function addMilestone(uint256 amount, string memory description) external onlyRelayer {
        milestones.push(Milestone({
            amount: amount,
            released: false,
            description: description
        }));
    }
    
    /**
     * @dev Close the campaign
     */
    function closeCampaign() external onlyRelayer {
        require(campaignActive, "Campaign already closed");
        campaignActive = false;
        emit CampaignClosed(totalDeposited, block.timestamp);
    }
    
    /**
     * @dev Get total number of contributors
     */
    function getContributorCount() external view returns (uint256) {
        return contributors.length;
    }
    
    /**
     * @dev Get total number of milestones
     */
    function getMilestoneCount() external view returns (uint256) {
        return milestones.length;
    }
    
    /**
     * @dev Get milestone details
     */
    function getMilestone(uint256 milestoneId) external view returns (
        uint256 amount,
        bool released,
        string memory description
    ) {
        require(milestoneId < milestones.length, "Invalid milestone ID");
        Milestone memory m = milestones[milestoneId];
        return (m.amount, m.released, m.description);
    }
    
    /**
     * @dev Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Emergency withdraw (only if campaign is closed and funds remain)
     */
    function emergencyWithdraw() external onlyRelayer {
        require(!campaignActive, "Campaign still active");
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = relayer.call{value: balance}("");
        require(success, "Transfer failed");
    }
}
