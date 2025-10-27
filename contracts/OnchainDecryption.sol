// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title OnchainDecryption - On-chain decryption demo contract
/// @notice Demonstrates how to use requestDecryption for asynchronous decryption
/// @dev Educational contract showcasing the FHE on-chain decryption mechanism
contract OnchainDecryption is SepoliaConfig {

    // Encrypted 32-bit number stored per user
    mapping(address => euint32) private userEncryptedNumbers;

    // Cleartext decryption result per user
    mapping(address => uint32) public decryptedNumbers;

    // Decryption state management
    mapping(address => bool) public isDecryptionPending;
    mapping(address => uint256) private latestRequestIds;

    // Events
    event NumberStored(address indexed user);
    event DecryptionRequested(address indexed user, uint256 requestId);
    event DecryptionCompleted(address indexed user, uint32 decryptedValue);

    mapping (uint256=>address) public requestIds;

    /// @notice Store encrypted 32-bit number (converted from external ciphertext + proof)
    function storeEncryptedNumber(externalEuint32 inputNumber, bytes calldata inputProof) external {
        // Convert external ciphertext to internal encrypted type used by the contract
        euint32 encryptedNumber = FHE.fromExternal(inputNumber, inputProof);

        userEncryptedNumbers[msg.sender] = encryptedNumber;

        // Configure ACL permissions for the stored ciphertext
        FHE.allowThis(userEncryptedNumbers[msg.sender]);
        FHE.allow(userEncryptedNumbers[msg.sender], msg.sender);

        emit NumberStored(msg.sender);
    }

    /// @notice Request decryption of caller's encrypted number
    function requestDecryptNumber() external returns (uint256) {
        require(FHE.isInitialized(userEncryptedNumbers[msg.sender]), "No encrypted number stored");
        require(!isDecryptionPending[msg.sender], "Decryption already pending");

        // Prepare ciphertext array to decrypt
        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(userEncryptedNumbers[msg.sender]);

        // Submit asynchronous decryption request
        uint256 requestId = FHE.requestDecryption(
            cts,
            this.callbackDecryptNumber.selector
        );

        // Update state
        isDecryptionPending[msg.sender] = true;
        latestRequestIds[msg.sender] = requestId;
        requestIds[requestId]=msg.sender;
        emit DecryptionRequested(msg.sender, requestId);

        return requestId;
    }

    /// @notice Decryption callback function invoked by the oracle
    function callbackDecryptNumber(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory decryptionProof
    ) public returns (bool) {
        // Validate request id
        address user = requestIds[requestId];
        require(user != address(0), "Invalid request ID");
        require(requestId == latestRequestIds[user], "Request ID mismatch");

        // Verify oracle signatures for the decryption
        FHE.checkSignatures(requestId, cleartexts, decryptionProof);

        // Decode decrypted result
        uint32 decryptedValue = abi.decode(cleartexts, (uint32));

        // Store result and clear pending flag
        decryptedNumbers[user] = decryptedValue;
        isDecryptionPending[user] = false;

        emit DecryptionCompleted(user, decryptedValue);

        return true;
    }

    /// @notice Return user's decryption status
    function getDecryptionStatus(address user) external view returns (
        bool pending,
        uint256 requestId,
        uint32 decryptedNumber
    ) {
        return (
            isDecryptionPending[user],
            latestRequestIds[user],
            decryptedNumbers[user]
        );
    }

    /// @notice Return the user's encrypted number handle
    function getEncryptedNumber(address user) external view returns (euint32) {
        return userEncryptedNumbers[user];
    }

    /// @notice Reset decryption state (demo helper)
    function resetDecryptionState() external {
        isDecryptionPending[msg.sender] = false;
        latestRequestIds[msg.sender] = 0;
        decryptedNumbers[msg.sender] = 0;
    }

    /// @notice Check whether user has an encrypted number
    function hasEncryptedNumber(address user) external view returns (bool) {
        return FHE.isInitialized(userEncryptedNumbers[user]);
    }
}
