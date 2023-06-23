// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

import "./IERC1363.sol";
import "./IERC1363Receiver.sol";
import "./IERC1363Spender.sol";
import "./Math.sol";

/**
 * @title ERC1363
 * @dev Implementation of an ERC1363 interface.
 */
contract TokenSale is ERC20, IERC1363, ERC165, IERC1363Receiver {
    using Address for address;

    uint public curveSlope;
    uint public curveConstant;

    constructor(
        uint256 _curveSlope,
        uint256 _curveConstant
    ) ERC20("LinearTokenSale", "LTS") {
        curveSlope = _curveSlope;
        curveConstant = _curveConstant;
    }

    receive() external payable {
        uint256 tokenAmount = _calculateTokensFromPrice(msg.value);
        _mint(msg.sender, tokenAmount);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC165, IERC165) returns (bool) {
        return
            interfaceId == type(IERC1363).interfaceId ||
            interfaceId == type(IERC1363Receiver).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * @dev Transfer tokens to a specified address and then execute a callback on `to`.
     * @param to The address to transfer to.
     * @param amount The amount to be transferred.
     * @return A boolean that indicates if the operation was successful.
     */
    function transferAndCall(
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        return transferAndCall(to, amount, "");
    }

    /**
     * @dev Transfer tokens to a specified address and then execute a callback on `to`.
     * @param to The address to transfer to
     * @param amount The amount to be transferred
     * @param data Additional data with no specified format
     * @return A boolean that indicates if the operation was successful.
     */
    function transferAndCall(
        address to,
        uint256 amount,
        bytes memory data
    ) public virtual override returns (bool) {
        transfer(to, amount);
        require(
            _checkOnTransferReceived(_msgSender(), to, amount, data),
            "ERC1363: receiver returned wrong data"
        );
        return true;
    }

    /**
     * @dev Transfer tokens from one address to another and then execute a callback on `to`.
     * @param from The address which you want to send tokens from
     * @param to The address which you want to transfer to
     * @param amount The amount of tokens to be transferred
     * @return A boolean that indicates if the operation was successful.
     */
    function transferFromAndCall(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        return transferFromAndCall(from, to, amount, "");
    }

    /**
     * @dev Transfer tokens from one address to another and then execute a callback on `to`.
     * @param from The address which you want to send tokens from
     * @param to The address which you want to transfer to
     * @param amount The amount of tokens to be transferred
     * @param data Additional data with no specified format
     * @return A boolean that indicates if the operation was successful.
     */
    function transferFromAndCall(
        address from,
        address to,
        uint256 amount,
        bytes memory data
    ) public virtual override returns (bool) {
        transferFrom(from, to, amount);
        require(
            _checkOnTransferReceived(from, to, amount, data),
            "ERC1363: receiver returned wrong data"
        );
        return true;
    }

    /**
     * @dev Approve spender to transfer tokens and then execute a callback on `spender`.
     * @param spender The address allowed to transfer to
     * @param amount The amount allowed to be transferred
     * @return A boolean that indicates if the operation was successful.
     */
    function approveAndCall(
        address spender,
        uint256 amount
    ) public virtual override returns (bool) {
        return approveAndCall(spender, amount, "");
    }

    /**
     * @dev Approve spender to transfer tokens and then execute a callback on `spender`.
     * @param spender The address allowed to transfer to.
     * @param amount The amount allowed to be transferred.
     * @param data Additional data with no specified format.
     * @return A boolean that indicates if the operation was successful.
     */
    function approveAndCall(
        address spender,
        uint256 amount,
        bytes memory data
    ) public virtual override returns (bool) {
        approve(spender, amount);
        require(
            _checkOnApprovalReceived(spender, amount, data),
            "ERC1363: spender returned wrong data"
        );
        return true;
    }

    function onTransferReceived(
        address,
        address sender,
        uint256 amount,
        bytes calldata
    ) external returns (bytes4) {
        require(
            msg.sender == address(this),
            "Only tokenSale contract can trigger onTransferReceived"
        );
        // tokens are already transfered back to the contract at this point
        _burn(address(this), amount);

        // Dummy pricing 1 token = 1 ether
        uint etherValue = amount;
        (bool success, ) = sender.call{value: etherValue}("");
        require(success, "Ether payment failed on token recieval");

        return IERC1363Receiver.onTransferReceived.selector;
    }

    /**
     * @dev Internal function to invoke {IERC1363Receiver-onTransferReceived} on a target address.
     *  The call is not executed if the target address is not a contract.
     * @param sender address Representing the previous owner of the given token amount
     * @param recipient address Target address that will receive the tokens
     * @param amount uint256 The amount mount of tokens to be transferred
     * @param data bytes Optional data to send along with the call
     * @return whether the call correctly returned the expected magic value
     */
    function _checkOnTransferReceived(
        address sender,
        address recipient,
        uint256 amount,
        bytes memory data
    ) internal virtual returns (bool) {
        if (!recipient.isContract()) {
            revert("ERC1363: transfer to non contract address");
        }

        try
            IERC1363Receiver(recipient).onTransferReceived(
                _msgSender(),
                sender,
                amount,
                data
            )
        returns (bytes4 retval) {
            return retval == IERC1363Receiver.onTransferReceived.selector;
        } catch (bytes memory reason) {
            if (reason.length == 0) {
                revert("ERC1363: transfer to non ERC1363Receiver implementer");
            } else {
                /// @solidity memory-safe-assembly
                assembly {
                    revert(add(32, reason), mload(reason))
                }
            }
        }
    }

    /**
     * @dev Internal function to invoke {IERC1363Receiver-onApprovalReceived} on a target address.
     *  The call is not executed if the target address is not a contract.
     * @param spender address The address which will spend the funds
     * @param amount uint256 The amount of tokens to be spent
     * @param data bytes Optional data to send along with the call
     * @return whether the call correctly returned the expected magic value
     */
    function _checkOnApprovalReceived(
        address spender,
        uint256 amount,
        bytes memory data
    ) internal virtual returns (bool) {
        if (!spender.isContract()) {
            revert("ERC1363: approve a non contract address");
        }

        try
            IERC1363Spender(spender).onApprovalReceived(
                _msgSender(),
                amount,
                data
            )
        returns (bytes4 retval) {
            return retval == IERC1363Spender.onApprovalReceived.selector;
        } catch (bytes memory reason) {
            if (reason.length == 0) {
                revert("ERC1363: approve a non ERC1363Spender implementer");
            } else {
                /// @solidity memory-safe-assembly
                assembly {
                    revert(add(32, reason), mload(reason))
                }
            }
        }
    }

    /**
     * @dev Returns the price for buying a specified number of tokens.
     * @param tokensToBuy The number of tokens to buy.
     * @return The price in wei.
     */
    function calculatePriceForBuy(
        uint256 tokensToBuy
    ) external view returns (uint256) {
        return _calculatePriceForBuy(tokensToBuy);
    }

    /**
     * @dev Returns the price for buying a specified number of tokens.
     * @param price The number of tokens to buy.
     * @return The price in wei.
     */
    function calculateTokensFromPrice(
        uint256 price
    ) external view returns (uint256) {
        return _calculateTokensFromPrice(price);
    }

    /**
     * @dev Calculates the price for buying a certain number of tokens based on the bonding curve formula.
     * @param _tokensToBuy The number of tokens to buy.
     * @return The price in wei for the specified number of tokens.
     */
    function _calculatePriceForBuy(
        uint256 _tokensToBuy
    ) private view returns (uint256) {
        return
            ((2 *
                curveConstant +
                curveSlope *
                (2 * totalSupply() + _tokensToBuy + 1)) * _tokensToBuy) / 2;
    }

    /**
     * @dev Calculates the price for buying a certain number of tokens based on the bonding curve formula.
     * @param _price The number of tokens to buy.
     * @return The price in wei for the specified number of tokens.
     */
    function _calculateTokensFromPrice(
        uint256 _price
    ) private view returns (uint256) {
        uint256 quadraticBase = 2 *
            curveConstant +
            2 *
            curveSlope *
            totalSupply() +
            curveSlope;
        uint quadratic = quadraticBase * quadraticBase;
        return
            (Math.sqrt(quadratic + 8 * _price) -
                (2 *
                    curveConstant +
                    2 *
                    curveSlope *
                    totalSupply() +
                    curveSlope)) / 2;
    }
}
