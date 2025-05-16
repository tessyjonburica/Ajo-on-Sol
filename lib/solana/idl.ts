export const IDL = {
  "version": "0.1.0",
  "name": "ajo",
  "types": [
    {
      "name": "CurrencyType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "SOL"
          },
          {
            "name": "USDC"
          }
        ]
      }
    },
    {
      "name": "CyclePeriod",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Weekly"
          },
          {
            "name": "Monthly"
          }
        ]
      }
    }
  ],
  "instructions": [
    {
      "name": "executePayout",
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "recipient",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "recipientWallet",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "recipientToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "PoolAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "publicKey"
          },
          {
            "name": "poolId",
            "type": "u64"
          },
          {
            "name": "currency",
            "type": {
              "defined": "CurrencyType"
            }
          },
          {
            "name": "contributionAmount",
            "type": "u64"
          },
          {
            "name": "totalMembers",
            "type": "u8"
          },
          {
            "name": "memberCount",
            "type": "u8"
          },
          {
            "name": "active",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "MemberAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "publicKey"
          },
          {
            "name": "pool",
            "type": "publicKey"
          },
          {
            "name": "hasCollected",
            "type": "bool"
          },
          {
            "name": "payoutPosition",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "VaultAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pool",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "PoolNotActive",
      "msg": "Pool is not active"
    },
    {
      "code": 6001,
      "name": "InvalidPayoutRecipient",
      "msg": "Invalid payout recipient"
    },
    {
      "code": 6002,
      "name": "InsufficientFunds",
      "msg": "Insufficient funds in pool"
    }
  ]
} as const; 