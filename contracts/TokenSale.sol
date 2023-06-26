// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./IERC1363.sol";
import "./IERC1363Receiver.sol";
import "./IERC1363Spender.sol";
import "@prb/math/contracts/PRBMathUD60x18Typed.sol";

/**
 * @title ERC1363
 * @dev Implementation of an ERC1363 interface.
 */
contract TokenSale is
    ERC20,
    IERC1363,
    ERC165,
    IERC1363Receiver,
    ReentrancyGuard
{
    using Address for address;
    using PRBMathUD60x18Typed for PRBMath.UD60x18;

    PRBMath.UD60x18 private curveConstant;
    PRBMath.UD60x18 private curveSlope;

    constructor(
        uint256 _curveSlope,
        uint256 _curveConstant
    ) ERC20("LinearTokenSale", "LTS") {
        require(
            _curveSlope != 0 || _curveConstant != 0,
            "Invalid curve: slope and constant are both zero"
        );
        curveConstant = PRBMath.UD60x18({value: _curveConstant});
        curveSlope = PRBMath.UD60x18({value: _curveSlope});
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
     * @dev Overrides the ERC20 transfer function with same functionality but including one extra step:
     * if 'to' is the tokenSale contract address, then it calls the transferAndCall function to trigger the callback
     * @param to The address to transfer to.
     * @param amount The amount to be transferred.
     * @return A boolean that indicates if the operation was successful.
     */
    function transfer(
        address to,
        uint256 amount
    ) public virtual override(ERC20, IERC20) returns (bool) {
        if (to == address(this)) {
            return transferAndCall(to, amount, "");
        }
        address owner = _msgSender();
        _transfer(owner, to, amount);
        return true;
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
        _transfer(_msgSender(), to, amount);
        require(
            _checkOnTransferReceived(_msgSender(), to, amount, data),
            "ERC1363: receiver returned wrong data"
        );
        return true;
    }

    /**
     * @dev Overrides the ERC20 transferFrom function with same functionality but including one extra step:
     * if 'to' is the tokenSale contract address, then it calls the transferFromAndCall function to trigger the callback
     * @param from The address which you want to send tokens from
     * @param to The address which you want to transfer to
     * @param amount The amount of tokens to be transferred
     * @return A boolean that indicates if the operation was successful.
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override(ERC20, IERC20) returns (bool) {
        if (to == address(this)) {
            return transferFromAndCall(from, to, amount, "");
        }
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
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
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
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
    ) external nonReentrant returns (bytes4) {
        require(
            msg.sender == address(this),
            "Only tokenSale contract can trigger onTransferReceived"
        );
        // tokens are already transfered back to the contract at this point
        _burn(address(this), amount);

        // After the burn, the value the user gets for the burnt tokens:
        // as if he would buy the tokens at this point
        uint etherValue = _calculatePrice(amount);
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
    function calculatePrice(
        uint256 tokensToBuy
    ) external view returns (uint256) {
        return _calculatePrice(tokensToBuy);
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
    function _calculatePrice(
        uint256 _tokensToBuy
    ) private view returns (uint256) {
        PRBMath.UD60x18 memory _tokensToBuy_ud = PRBMath.UD60x18({
            value: _tokensToBuy
        });
        PRBMath.UD60x18 memory totalSupply_ud = PRBMath.UD60x18({
            value: totalSupply()
        });
        PRBMath.UD60x18 memory constant_1 = PRBMath.UD60x18({value: 1e18});
        PRBMath.UD60x18 memory constant_2 = PRBMath.UD60x18({value: 2e18});
        return
            (
                (curveConstant.mul(constant_2)).add(
                    curveSlope.mul(
                        totalSupply_ud.mul(constant_2).add(_tokensToBuy_ud).add(
                            constant_1
                        )
                    )
                )
            ).mul(_tokensToBuy_ud).div(constant_2).value;
    }

    /**
     * @dev Calculates the price for buying a certain number of tokens based on the bonding curve formula.
     * @param _price The number of tokens to buy.
     * @return The price in wei for the specified number of tokens.
     */
    function _calculateTokensFromPrice(
        uint256 _price
    ) private view returns (uint256) {
        PRBMath.UD60x18 memory _price_ud = PRBMath.UD60x18({value: _price});
        if (curveSlope.value != 0) {
            PRBMath.UD60x18 memory totalSupply_ud = PRBMath.UD60x18({
                value: totalSupply()
            });
            PRBMath.UD60x18 memory constant_2 = PRBMath.UD60x18({value: 2e18});
            PRBMath.UD60x18 memory constant_8 = PRBMath.UD60x18({value: 8e18});
            return
                curveConstant
                    .mul(constant_2)
                    .add(curveSlope.mul(totalSupply_ud.mul(constant_2)))
                    .add(curveSlope)
                    .pow(constant_2)
                    .add(_price_ud.mul(curveSlope).mul(constant_8))
                    .sqrt()
                    .sub(
                        curveConstant
                            .mul(constant_2)
                            .add(curveSlope.mul(constant_2).mul(totalSupply_ud))
                            .add(curveSlope)
                    )
                    .div(curveSlope.mul(constant_2))
                    .value;
        } else {
            return _price_ud.mul(curveConstant).value;
        }
    }
}
