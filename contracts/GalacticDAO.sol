// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title StarToken
 * @dev Governance token for the Galactic Federation.
 * Players earn this by completing milestones or high-tier trading.
 */
contract StarToken {
    string public name = "Galactic Star Credit";
    string public symbol = "STAR";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(uint256 initialSupply) {
        mint(msg.sender, initialSupply);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        
        allowance[from][msg.sender] -= value;
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
        return true;
    }

    function mint(address to, uint256 value) public {
        // In a real game, this would be restricted to the GameServer or Governance contract
        totalSupply += value;
        balanceOf[to] += value;
        emit Transfer(address(0), to, value);
    }
}

/**
 * @title GalacticDAO
 * @dev Manages proposals and voting for the game's evolution.
 */
contract GalacticDAO {
    struct Proposal {
        uint256 id;
        string description;
        uint256 voteCount;
        uint256 endTime;
        bool executed;
        address proposer;
    }

    StarToken public governanceToken;
    Proposal[] public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    uint256 public constant VOTING_DURATION = 3 days;

    event ProposalCreated(uint256 id, string description, address proposer);
    event Voted(uint256 proposalId, address voter, uint256 weight);

    constructor(address _tokenAddress) {
        governanceToken = StarToken(_tokenAddress);
    }

    function createProposal(string calldata _description) external {
        // Require holding at least 100 STAR to propose
        require(governanceToken.balanceOf(msg.sender) >= 100 * 10**18, "Insufficient STAR to propose");

        proposals.push(Proposal({
            id: proposals.length,
            description: _description,
            voteCount: 0,
            endTime: block.timestamp + VOTING_DURATION,
            executed: false,
            proposer: msg.sender
        }));

        emit ProposalCreated(proposals.length - 1, _description, msg.sender);
    }

    function vote(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];
        require(block.timestamp < proposal.endTime, "Voting ended");
        require(!hasVoted[_proposalId][msg.sender], "Already voted");

        uint256 weight = governanceToken.balanceOf(msg.sender);
        require(weight > 0, "No voting weight");

        hasVoted[_proposalId][msg.sender] = true;
        proposal.voteCount += weight;

        emit Voted(_proposalId, msg.sender, weight);
    }

    function executeProposal(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];
        require(block.timestamp >= proposal.endTime, "Voting not ended");
        require(!proposal.executed, "Already executed");

        proposal.executed = true;
        
        // Logic to apply changes would go here (e.g., calling GameSettings contract)
    }
}
