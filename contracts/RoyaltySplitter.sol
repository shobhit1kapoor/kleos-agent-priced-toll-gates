// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract RoyaltySplitter {
    event RoyaltySplit(
        bytes32 indexed paymentId,
        address indexed token,
        address indexed recipient,
        uint256 amount,
        uint16 splitBps
    );

    error InvalidSplitTotal();
    error InvalidInput();
    error TransferFailed();

    function splitPayment(
        bytes32 paymentId,
        address token,
        uint256 totalAmount,
        address[] calldata recipients,
        uint16[] calldata splitBps
    ) external {
        if (
            token == address(0) ||
            totalAmount == 0 ||
            recipients.length == 0 ||
            recipients.length != splitBps.length
        ) {
            revert InvalidInput();
        }

        uint256 totalBps;
        for (uint256 i = 0; i < splitBps.length; i++) {
            totalBps += splitBps[i];
        }

        if (totalBps != 10_000) {
            revert InvalidSplitTotal();
        }

        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 amount = (totalAmount * splitBps[i]) / 10_000;
            bool ok = IERC20(token).transferFrom(msg.sender, recipients[i], amount);
            if (!ok) {
                revert TransferFailed();
            }

            emit RoyaltySplit(paymentId, token, recipients[i], amount, splitBps[i]);
        }
    }
}
