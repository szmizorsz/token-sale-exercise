# ERC1363 Token Sale with a Linear Bonding Curve

The curve is defined: $`y=sx+c`$

The price calculation: $`p=(2c+s(2t+b+1))b/2`$

Where $t$ is the current total supply and $b$ is the number of tokens to buy.

The number of tokens to buy from a given price: $`b=(-(2c+2st+s)+sqrt{((2c+2st+s)^2+8ps)})/2s`$

Some thoughts on possible improvements:

- There could be additional security enhancements by introducing pausibility to critical functions. That would come with introduction of contract owner as well.
- There could be measurments for the theoretical maximum limit of the slope and constant, so that the equations still do not trigger overflow errors. We could check for these teorethical limits in the constructor and revert if they are not met.
- Within these theoretical limits it would worth to evaluate a special case: what if the user does not send the exact price for the tokens that he wants to buy, and the leftover is significant enough that it would be fair to send it back to the user. For example, suppose a user wants to buy 0.000..04 tokens (four times the smallest possible unit to buy), but the value they send with the transaction only allows them to purchase 0.000..03 tokens. If the leftover after buying 0.000..03 is significant enough, it could be returned to the user. It would be worth considering whether this scenario is theoretically possible and how to define "significant enough" in this context. Significant enough could be something like more than the gas it consumes to send it back to the user. E.g.: block.basfee \* 21000 (gas for transfer and send).
- Test sets currently follow the same user flows (test scenarios) but for different curves, e.g., "Should receive ether from TWO users, mint tokens, burn ONE user's tokens completely, and send ether back". For code maintainability, it would be beneficial to consider how to abstract these scenarios from the test sets and make them reusable for different curves. Currently, only the steps are abstracted out, but in the long run, it would be advantageous to abstract the entire scenarios.
