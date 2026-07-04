// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SourceRegistry {
    struct Split {
        address recipient;
        uint16 splitBps;
    }

    struct Source {
        address owner;
        bytes32 creatorScopedId;
        string metadataCid;
        string encryptedContentCid;
        bytes32 splitDigest;
        bool active;
    }

    mapping(bytes32 => Source) public sources;

    event SourceRegistered(
        bytes32 indexed sourceId,
        address indexed owner,
        bytes32 indexed creatorScopedId,
        string metadataCid,
        string encryptedContentCid,
        bytes32 splitDigest
    );

    event SourceDeactivated(bytes32 indexed sourceId, address indexed owner);

    function registerSource(
        bytes32 sourceId,
        bytes32 creatorScopedId,
        string calldata metadataCid,
        string calldata encryptedContentCid,
        Split[] calldata splits
    ) external {
        require(sourceId != bytes32(0), "source id required");
        require(!sources[sourceId].active, "source already active");
        require(bytes(metadataCid).length > 0, "metadata cid required");
        require(bytes(encryptedContentCid).length > 0, "content cid required");
        require(splits.length > 0, "splits required");

        uint256 totalBps = 0;
        for (uint256 index = 0; index < splits.length; index += 1) {
            require(splits[index].recipient != address(0), "recipient required");
            totalBps += splits[index].splitBps;
        }
        require(totalBps == 10_000, "splits must equal 10000 bps");

        bytes32 splitDigest = keccak256(abi.encode(splits));
        sources[sourceId] = Source({
            owner: msg.sender,
            creatorScopedId: creatorScopedId,
            metadataCid: metadataCid,
            encryptedContentCid: encryptedContentCid,
            splitDigest: splitDigest,
            active: true
        });

        emit SourceRegistered(
            sourceId,
            msg.sender,
            creatorScopedId,
            metadataCid,
            encryptedContentCid,
            splitDigest
        );
    }

    function deactivateSource(bytes32 sourceId) external {
        Source storage source = sources[sourceId];
        require(source.active, "source not active");
        require(source.owner == msg.sender, "not owner");
        source.active = false;
        emit SourceDeactivated(sourceId, msg.sender);
    }
}
