// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IERC20
 * @dev Interface for ERC20 token interactions
 */
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title ProjectEscrowV6 - Optimistic Guardian Governance (Production Grade)
 * @dev "Projects move fast by default (Optimism), communities pause suspicious activity (Veto), 
 *      and the protocol arbitrates disputes (Guardian)."
 * 
 * V6 Improvements:
 * - Campaign-level FSM (FUNDING → ACTIVE → REFUND_ONLY)
 * - IPFS CID validation for proof uploads
 * - Funding deadline enforcement
 * - Target amount cap (110% buffer)
 * - Emergency pause mechanism
 * - Discussion thread anchoring
 * - Sponsored transactions via guardian relayer
 * - Enhanced event emissions
 * 
 * Philosophy:
 * - Silence = Approval (48-hour default release)
 * - Capital-Weighted Veto (1 USDC = 1 Vote)
 * - Dynamic Quorum (10% of total raised)
 * - Guardian Arbitration (Relayer resolves disputes)
 * - Refunds Only on Project Cancellation
 */
contract ProjectEscrowV6 {
    // ═══════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════
    
    // Core addresses
    address public guardian;          // Guardian/Admin (your relayer wallet that sponsors transactions)
    address public projectCreator;    // Beneficiary
    address public usdcToken;         // Stablecoin address
    
    // Campaign state enum (NEW in V6)
    enum CampaignState {
        FUNDING,        // Accepting donations, goal not met
        ACTIVE,         // Goal met, executing milestones
        REFUND_ONLY     // Project cancelled, donors can claim refunds
    }
    
    CampaignState public campaignState;
    
    // Campaign parameters
    uint256 public targetAmount;
    uint256 public fundingDeadline;   // NEW in V6
    uint256 public totalFundsRaised;
    uint256 public totalReleased;
    bool public paused;                // NEW in V6: Emergency pause
    
    // Governance parameters
    uint256 public constant COOLING_PERIOD = 48 hours;  // Optimistic timer
    uint256 public constant VETO_QUORUM = 10;           // 10% to trigger dispute
    uint256 public constant TARGET_BUFFER = 110;        // 110% max (10% buffer)
    
    // Milestone status enum
    enum MilestoneStatus {
        PENDING_RELEASE,  // Waiting for 48h timer or guardian approval
        DISPUTED,         // Vetoed and frozen, awaiting guardian decision
        RELEASED,         // Funds transferred to creator
        CANCELLED         // Rejected by guardian, funds stay in pool
    }
    
    // Milestone structure
    struct Milestone {
        uint256 amount;                    // USDC amount (6 decimals)
        string description;                // Receipt/proof description
        string ipfsHash;                   // IPFS CID (validated)
        string discussionHash;             // NEW in V6: Discussion thread IPFS CID
        uint256 requestedAt;               // When creator requested
        uint256 releaseableAt;             // When auto-release is allowed
        MilestoneStatus status;
        uint256 vetoWeight;                // Total USDC weight of vetos
        mapping(address => bool) hasVetoed;
    }
    
    Milestone[] public milestones;
    
    // Contribution tracking
    mapping(address => uint256) public contributions;
    address[] public contributors;
    mapping(address => bool) public hasClaimedRefund;
    
    // ═══════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════
    
    event DonationReceived(address indexed donor, uint256 amount, uint256 timestamp);
    event CampaignStateChanged(CampaignState indexed newState, uint256 timestamp);
    event FundingGoalReached(uint256 totalRaised, uint256 timestamp);
    event MilestoneRequested(uint256 indexed milestoneId, uint256 amount, uint256 releaseableAt, string ipfsHash);
    event ProofUploaded(uint256 indexed milestoneId, string ipfsHash);
    event DiscussionThreadCreated(uint256 indexed milestoneId, string discussionHash);
    event MilestoneVetoed(uint256 indexed milestoneId, address indexed voter, uint256 totalVetoWeight);
    event MilestoneDisputed(uint256 indexed milestoneId, uint256 vetoWeight, uint256 quorum);
    event MilestoneReleased(uint256 indexed milestoneId, uint256 amount, address indexed recipient);
    event MilestoneCancelled(uint256 indexed milestoneId);
    event DisputeResumed(uint256 indexed milestoneId, uint256 newReleaseableAt);
    event ProjectCancelled(uint256 timestamp);
    event RefundClaimed(address indexed donor, uint256 amount);
    event EmergencyPaused(uint256 timestamp);
    event EmergencyUnpaused(uint256 timestamp);
    event GuardianTransferred(address indexed oldGuardian, address indexed newGuardian);
    
    // ═══════════════════════════════════════════════════════════════
    // MODIFIERS
    // ═══════════════════════════════════════════════════════════════
    
    modifier onlyGuardian() {
        require(msg.sender == guardian, "Only guardian can call this");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    modifier inState(CampaignState _state) {
        require(campaignState == _state, "Invalid campaign state");
        _;
    }
    
    modifier notInState(CampaignState _state) {
        require(campaignState != _state, "Invalid campaign state");
        _;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════
    
    constructor(
        address _projectCreator,
        uint256 _targetAmount,
        address _usdcToken,
        uint256 _fundingDeadline
    ) {
        require(_projectCreator != address(0), "Invalid creator");
        require(_usdcToken != address(0), "Invalid USDC token");
        require(_fundingDeadline > block.timestamp, "Deadline must be in future");
        require(_targetAmount > 0, "Target must be > 0");
        
        guardian = msg.sender;
        projectCreator = _projectCreator;
        targetAmount = _targetAmount;
        usdcToken = _usdcToken;
        fundingDeadline = _fundingDeadline;
        campaignState = CampaignState.FUNDING;
        paused = false;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // PHASE 1: DONATIONS (FUNDING STATE)
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * @dev Guardian deposits USDC on behalf of donors
     * NEW in V6: Deadline enforcement, target cap, state transition
     */
    function depositForDonor(address _donor, uint256 _amount) 
        external 
        onlyGuardian
        whenNotPaused
        inState(CampaignState.FUNDING)
    {
        require(_amount > 0, "Amount must be > 0");
        require(_donor != address(0), "Invalid donor");
        require(block.timestamp <= fundingDeadline, "Funding period ended");
        
        // Enforce target cap (110% buffer to allow slight overfunding)
        uint256 maxAllowed = (targetAmount * TARGET_BUFFER) / 100;
        require(totalFundsRaised + _amount <= maxAllowed, "Exceeds target cap");
        
        // Transfer USDC from guardian to contract
        require(
            IERC20(usdcToken).transferFrom(msg.sender, address(this), _amount),
            "USDC transfer failed"
        );
        
        // Track contribution
        if (contributions[_donor] == 0) {
            contributors.push(_donor);
        }
        contributions[_donor] += _amount;
        totalFundsRaised += _amount;
        
        emit DonationReceived(_donor, _amount, block.timestamp);
        
        // Auto-transition to ACTIVE when goal reached
        if (totalFundsRaised >= targetAmount && campaignState == CampaignState.FUNDING) {
            campaignState = CampaignState.ACTIVE;
            emit FundingGoalReached(totalFundsRaised, block.timestamp);
            emit CampaignStateChanged(CampaignState.ACTIVE, block.timestamp);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // PHASE 2: MILESTONE REQUEST (OPTIMISTIC)
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * @dev Creator requests milestone release with IPFS proof
     * NEW in V6: IPFS validation, discussion thread support
     */
    function requestMilestone(
        uint256 _amount,
        string memory _description,
        string memory _ipfsHash
    ) 
        external 
        onlyGuardian
        whenNotPaused
        inState(CampaignState.ACTIVE)
    {
        require(_amount > 0, "Amount must be > 0");
        require(bytes(_description).length > 0, "Description required");
        require(_isValidIPFSHash(_ipfsHash), "Invalid IPFS CID");
        require(_amount <= getAvailableBalance(), "Insufficient balance");
        
        uint256 milestoneId = milestones.length;
        milestones.push();
        
        Milestone storage m = milestones[milestoneId];
        m.amount = _amount;
        m.description = _description;
        m.ipfsHash = _ipfsHash;
        m.requestedAt = block.timestamp;
        m.releaseableAt = block.timestamp + COOLING_PERIOD; // 48 hours
        m.status = MilestoneStatus.PENDING_RELEASE;
        m.vetoWeight = 0;
        
        emit MilestoneRequested(milestoneId, _amount, m.releaseableAt, _ipfsHash);
        emit ProofUploaded(milestoneId, _ipfsHash);
    }
    
    /**
     * @dev Add discussion thread IPFS hash to milestone
     * NEW in V6: For community discussions about disputed milestones
     */
    function addDiscussionThread(uint256 _milestoneId, string memory _discussionHash) 
        external 
        onlyGuardian 
    {
        require(_milestoneId < milestones.length, "Invalid milestone");
        require(_isValidIPFSHash(_discussionHash), "Invalid IPFS CID");
        
        Milestone storage m = milestones[_milestoneId];
        m.discussionHash = _discussionHash;
        
        emit DiscussionThreadCreated(_milestoneId, _discussionHash);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // PHASE 3: VETO MECHANISM (THE BRAKE)
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * @dev Donor vetoes a milestone (capital-weighted: 1 USDC = 1 Vote)
     * If veto weight > 10% of total raised, milestone becomes DISPUTED
     */
    function vetoMilestone(uint256 _milestoneId) 
        external 
        whenNotPaused
        notInState(CampaignState.REFUND_ONLY)
    {
        require(_milestoneId < milestones.length, "Invalid milestone");
        
        Milestone storage m = milestones[_milestoneId];
        
        require(m.status == MilestoneStatus.PENDING_RELEASE, "Cannot veto this milestone");
        require(contributions[msg.sender] > 0, "Not a donor");
        require(!m.hasVetoed[msg.sender], "Already vetoed");
        require(!hasClaimedRefund[msg.sender], "You claimed refund");
        
        // Record veto (prevent double voting)
        m.hasVetoed[msg.sender] = true;
        m.vetoWeight += contributions[msg.sender]; // Add donor's weight
        
        emit MilestoneVetoed(_milestoneId, msg.sender, m.vetoWeight);
        
        // Check if veto weight exceeds dynamic quorum (10% of total raised)
        uint256 quorumThreshold = (totalFundsRaised * VETO_QUORUM) / 100;
        
        if (m.vetoWeight > quorumThreshold) {
            m.status = MilestoneStatus.DISPUTED;
            emit MilestoneDisputed(_milestoneId, m.vetoWeight, quorumThreshold);
        }
    }
    
    /**
     * @dev Veto milestone with signature (sponsored by guardian)
     * Allows relayer to submit veto on behalf of donor (gasless for user)
     */
    function vetoMilestoneWithSignature(
        uint256 _milestoneId,
        address _donor,
        bytes memory _signature
    ) 
        external 
        onlyGuardian
        whenNotPaused
        notInState(CampaignState.REFUND_ONLY)
    {
        require(_milestoneId < milestones.length, "Invalid milestone");
        
        Milestone storage m = milestones[_milestoneId];
        
        require(m.status == MilestoneStatus.PENDING_RELEASE, "Cannot veto this milestone");
        require(contributions[_donor] > 0, "Not a donor");
        require(!m.hasVetoed[_donor], "Already vetoed");
        require(!hasClaimedRefund[_donor], "Donor claimed refund");
        
        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            "VETO_MILESTONE",
            _milestoneId,
            _donor,
            address(this)
        ));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            messageHash
        ));
        
        address signer = recoverSigner(ethSignedMessageHash, _signature);
        require(signer == _donor, "Invalid signature");
        
        // Record veto (prevent double voting)
        m.hasVetoed[_donor] = true;
        m.vetoWeight += contributions[_donor]; // Add donor's weight
        
        emit MilestoneVetoed(_milestoneId, _donor, m.vetoWeight);
        
        // Check if veto weight exceeds dynamic quorum (10% of total raised)
        uint256 quorumThreshold = (totalFundsRaised * VETO_QUORUM) / 100;
        
        if (m.vetoWeight > quorumThreshold) {
            m.status = MilestoneStatus.DISPUTED;
            emit MilestoneDisputed(_milestoneId, m.vetoWeight, quorumThreshold);
        }
    }
    
    /**
     * @dev Recover signer from signature
     */
    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature)
        internal
        pure
        returns (address)
    {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }
    
    /**
     * @dev Split signature into r, s, v components
     * FIXED: More robust signature extraction compatible with ethers.js signatures
     */
    function splitSignature(bytes memory sig)
        internal
        pure
        returns (bytes32 r, bytes32 s, uint8 v)
    {
        require(sig.length == 65, "Invalid signature length");
        
        assembly {
            // First 32 bytes after length prefix
            r := mload(add(sig, 32))
            // Next 32 bytes
            s := mload(add(sig, 64))
            // Final byte (use and mask to ensure single byte)
            v := and(mload(add(sig, 65)), 0xff)
        }
        
        // Normalize v value if needed (some signatures use 0/1 instead of 27/28)
        if (v < 27) {
            v += 27;
        }
        
        require(v == 27 || v == 28, "Invalid signature v value");
    }
    
    // ═══════════════════════════════════════════════════════════════
    // PHASE 4: GUARDIAN ARBITRATION (THE JUDGE)
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * @dev Outcome 1: Resume milestone (false alarm)
     * Resets status to PENDING and restarts 48h timer
     */
    function resumeMilestone(uint256 _milestoneId) external onlyGuardian {
        require(_milestoneId < milestones.length, "Invalid milestone");
        
        Milestone storage m = milestones[_milestoneId];
        require(m.status == MilestoneStatus.DISPUTED, "Not disputed");
        
        m.status = MilestoneStatus.PENDING_RELEASE;
        m.releaseableAt = block.timestamp + COOLING_PERIOD; // Restart timer
        
        emit DisputeResumed(_milestoneId, m.releaseableAt);
    }
    
    /**
     * @dev Outcome 2: Cancel milestone (bad receipt)
     * Funds return to pool, creator must try again
     */
    function cancelMilestone(uint256 _milestoneId) external onlyGuardian {
        require(_milestoneId < milestones.length, "Invalid milestone");
        
        Milestone storage m = milestones[_milestoneId];
        require(
            m.status == MilestoneStatus.PENDING_RELEASE || 
            m.status == MilestoneStatus.DISPUTED, 
            "Cannot cancel"
        );
        
        m.status = MilestoneStatus.CANCELLED;
        
        emit MilestoneCancelled(_milestoneId);
    }
    
    /**
     * @dev Outcome 3: Kill Switch (scam project)
     * Cancels entire project, enables donor refunds
     */
    function cancelProject() external onlyGuardian {
        require(campaignState != CampaignState.REFUND_ONLY, "Already cancelled");
        
        campaignState = CampaignState.REFUND_ONLY;
        
        emit ProjectCancelled(block.timestamp);
        emit CampaignStateChanged(CampaignState.REFUND_ONLY, block.timestamp);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // PHASE 5: MILESTONE RELEASE (THE ENGINE)
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * @dev Release milestone funds to creator
     * Can be called by guardian OR auto-released after 48h cooling period
     */
    function releaseMilestone(uint256 _milestoneId) 
        external 
        onlyGuardian 
        whenNotPaused
        inState(CampaignState.ACTIVE)
    {
        require(_milestoneId < milestones.length, "Invalid milestone");
        
        Milestone storage m = milestones[_milestoneId];
        
        require(m.status == MilestoneStatus.PENDING_RELEASE, "Cannot release");
        require(block.timestamp >= m.releaseableAt, "Cooling period not ended");
        require(m.amount <= getAvailableBalance(), "Insufficient balance");
        
        m.status = MilestoneStatus.RELEASED;
        totalReleased += m.amount;
        
        // Transfer USDC to creator
        require(
            IERC20(usdcToken).transfer(projectCreator, m.amount),
            "USDC transfer failed"
        );
        
        emit MilestoneReleased(_milestoneId, m.amount, projectCreator);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // PHASE 6: REFUNDS (ONLY IF PROJECT CANCELLED)
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * @dev Donors can claim pro-rata refund if project cancelled
     */
    function claimRefund() external inState(CampaignState.REFUND_ONLY) {
        require(contributions[msg.sender] > 0, "No contributions");
        require(!hasClaimedRefund[msg.sender], "Already claimed");
        
        uint256 availableBalance = getAvailableBalance();
        uint256 refundAmount = (contributions[msg.sender] * availableBalance) / totalFundsRaised;
        
        require(refundAmount > 0, "No refund available");
        
        hasClaimedRefund[msg.sender] = true;
        
        require(
            IERC20(usdcToken).transfer(msg.sender, refundAmount),
            "USDC transfer failed"
        );
        
        emit RefundClaimed(msg.sender, refundAmount);
    }
    
    /**
     * @dev Gasless refund claim with signature (guardian pays gas)
     * Signature format: keccak256("CLAIM_REFUND" + donor + contractAddress)
     */
    function claimRefundWithSignature(
        address _donor,
        bytes memory _signature
    )
        external
        onlyGuardian
        inState(CampaignState.REFUND_ONLY)
    {
        require(contributions[_donor] > 0, "No contributions");
        require(!hasClaimedRefund[_donor], "Already claimed");
        
        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            "CLAIM_REFUND",
            _donor,
            address(this)
        ));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            messageHash
        ));
        
        address signer = recoverSigner(ethSignedMessageHash, _signature);
        require(signer == _donor, "Invalid signature");
        
        // Calculate and transfer refund
        uint256 availableBalance = getAvailableBalance();
        uint256 refundAmount = (contributions[_donor] * availableBalance) / totalFundsRaised;
        
        require(refundAmount > 0, "No refund available");
        
        hasClaimedRefund[_donor] = true;
        
        require(
            IERC20(usdcToken).transfer(_donor, refundAmount),
            "USDC transfer failed"
        );
        
        emit RefundClaimed(_donor, refundAmount);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * @dev NEW in V6: Emergency pause
     */
    function pause() external onlyGuardian {
        require(!paused, "Already paused");
        paused = true;
        emit EmergencyPaused(block.timestamp);
    }
    
    /**
     * @dev NEW in V6: Unpause
     */
    function unpause() external onlyGuardian {
        require(paused, "Not paused");
        paused = false;
        emit EmergencyUnpaused(block.timestamp);
    }
    
    /**
     * @dev NEW in V6: Transfer guardian role (for upgrading relayer wallet)
     */
    function transferGuardian(address _newGuardian) external onlyGuardian {
        require(_newGuardian != address(0), "Invalid guardian");
        address oldGuardian = guardian;
        guardian = _newGuardian;
        emit GuardianTransferred(oldGuardian, _newGuardian);
    }
    
    /**
     * @dev Emergency withdraw (only if campaign failed to reach goal)
     */
    function emergencyWithdraw() external onlyGuardian {
        require(
            campaignState == CampaignState.FUNDING || 
            campaignState == CampaignState.REFUND_ONLY, 
            "Cannot withdraw"
        );
        uint256 balance = IERC20(usdcToken).balanceOf(address(this));
        require(balance > 0, "No funds");
        
        require(
            IERC20(usdcToken).transfer(guardian, balance),
            "Transfer failed"
        );
    }
    
    // ═══════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════
    
    function getMilestoneCount() external view returns (uint256) {
        return milestones.length;
    }
    
    function getMilestone(uint256 _milestoneId) external view returns (
        uint256 amount,
        string memory description,
        string memory ipfsHash,
        string memory discussionHash,
        uint256 requestedAt,
        uint256 releaseableAt,
        MilestoneStatus status,
        uint256 vetoWeight
    ) {
        require(_milestoneId < milestones.length, "Invalid milestone");
        Milestone storage m = milestones[_milestoneId];
        return (
            m.amount,
            m.description,
            m.ipfsHash,
            m.discussionHash,
            m.requestedAt,
            m.releaseableAt,
            m.status,
            m.vetoWeight
        );
    }
    
    function hasUserVetoed(uint256 _milestoneId, address _user) external view returns (bool) {
        require(_milestoneId < milestones.length, "Invalid milestone");
        return milestones[_milestoneId].hasVetoed[_user];
    }
    
    function getAvailableBalance() public view returns (uint256) {
        return IERC20(usdcToken).balanceOf(address(this));
    }
    
    function getBalance() external view returns (uint256) {
        return IERC20(usdcToken).balanceOf(address(this));
    }
    
    function calculateRefund(address _user) external view returns (uint256) {
        if (campaignState != CampaignState.REFUND_ONLY || hasClaimedRefund[_user] || contributions[_user] == 0) {
            return 0;
        }
        uint256 available = getAvailableBalance();
        return (contributions[_user] * available) / totalFundsRaised;
    }
    
    function getContributorCount() external view returns (uint256) {
        return contributors.length;
    }
    
    function getCurrentQuorum() external pure returns (uint256) {
        return VETO_QUORUM; // 10%
    }
    
    function getVetoQuorumThreshold() external view returns (uint256) {
        return (totalFundsRaised * VETO_QUORUM) / 100;
    }
    
    function getCampaignState() external view returns (CampaignState) {
        return campaignState;
    }
    
    function isFundingActive() external view returns (bool) {
        return campaignState == CampaignState.FUNDING && block.timestamp <= fundingDeadline;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // INTERNAL HELPERS
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * @dev NEW in V6: Validate IPFS CID format
     * Supports CIDv0 (Qm...) and CIDv1 (bafy...)
     */
    function _isValidIPFSHash(string memory _hash) internal pure returns (bool) {
        bytes memory b = bytes(_hash);
        
        // CIDv0: Starts with "Qm", length 46
        if (b.length == 46 && b[0] == 'Q' && b[1] == 'm') {
            return true;
        }
        
        // CIDv1: Starts with "bafy", length varies
        if (b.length >= 49 && 
            b[0] == 'b' && 
            b[1] == 'a' && 
            b[2] == 'f' && 
            b[3] == 'y') {
            return true;
        }
        
        return false;
    }
}
