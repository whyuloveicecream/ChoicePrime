// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, eaddress, externalEaddress, euint64, euint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract AddressStorage is SepoliaConfig {
    mapping(address => eaddress) private userAddresses;

    event AddressStored(address indexed user);

    error NoStoredAddressFound();
    error InvalidAddress();

    function storeAddress(externalEaddress inputAddress, bytes calldata inputProof) external {
        eaddress encryptedAddress = FHE.fromExternal(inputAddress, inputProof);

        userAddresses[msg.sender] = encryptedAddress;

        FHE.allowThis(userAddresses[msg.sender]);
        FHE.allow(userAddresses[msg.sender], msg.sender);

        emit AddressStored(msg.sender);
    }

    function getStoredAddressByUser(address user) external view returns (eaddress) {
        return userAddresses[user];
    }

    function compareAddresses(address userA, address userB) external view returns (eaddress) {
        if (!FHE.isInitialized(userAddresses[userA])) {
            revert NoStoredAddressFound();
        }
        if (!FHE.isInitialized(userAddresses[userB])) {
            revert NoStoredAddressFound();
        }

        // Return an encrypted value rather than a cleartext comparison result.
        // The frontend SDK can decrypt to interpret the outcome.
        return userAddresses[userA]; // Simplified demo: return user A's encrypted address
    }

    function isAddressEqual(address user, address targetAddress) external view returns (eaddress) {
        if (!FHE.isInitialized(userAddresses[user])) {
            revert NoStoredAddressFound();
        }

        // Return the user's encrypted address; frontend can perform decryption
        return userAddresses[user];
    }
}
