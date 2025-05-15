/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/ajo.json`.
 */
export type Ajo = {
  "address": "EiKhShgBVKz8bNY4eqAxQByS6CvsCeKVavxFhba38QFk",
  "metadata": {
    "name": "ajo",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "createPool",
      "discriminator": [
        233,
        146,
        209,
        142,
        207,
        104,
        64,
        188
      ],
      "accounts": [
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              },
              {
                "kind": "arg",
                "path": "poolId"
              }
            ]
          }
        },
        {
          "name": "member",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "creator"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              }
            ]
          }
        },
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "poolId",
          "type": "u64"
        },
        {
          "name": "currency",
          "type": {
            "defined": {
              "name": "currencyType"
            }
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
          "name": "totalCycles",
          "type": "u8"
        },
        {
          "name": "cyclePeriod",
          "type": {
            "defined": {
              "name": "cyclePeriod"
            }
          }
        },
        {
          "name": "creatorPosition",
          "type": "u8"
        },
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "executePayout",
      "discriminator": [
        12,
        35,
        52,
        7,
        95,
        19,
        169,
        21
      ],
      "accounts": [
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "recipient",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "recipientWallet"
              }
            ]
          }
        },
        {
          "name": "recipientWallet",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "vaultToken",
          "writable": true,
          "optional": true
        },
        {
          "name": "recipientToken",
          "writable": true,
          "optional": true
        },
        {
          "name": "tokenProgram",
          "optional": true,
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "joinPool",
      "discriminator": [
        14,
        65,
        62,
        16,
        116,
        17,
        195,
        107
      ],
      "accounts": [
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "member",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "payoutPosition",
          "type": "u8"
        },
        {
          "name": "questionnaireAnswers",
          "type": {
            "vec": "string"
          }
        }
      ]
    },
    {
      "name": "makeContribution",
      "discriminator": [
        2,
        33,
        6,
        104,
        211,
        177,
        128,
        109
      ],
      "accounts": [
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "member",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "userToken",
          "writable": true,
          "optional": true
        },
        {
          "name": "vaultToken",
          "writable": true,
          "optional": true
        },
        {
          "name": "tokenProgram",
          "optional": true,
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "memberAccount",
      "discriminator": [
        173,
        25,
        100,
        97,
        192,
        177,
        84,
        139
      ]
    },
    {
      "name": "vaultAccount",
      "discriminator": [
        230,
        251,
        241,
        83,
        139,
        202,
        93,
        28
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "poolFull",
      "msg": "Pool is already full"
    },
    {
      "code": 6001,
      "name": "memberExists",
      "msg": "Member already exists in pool"
    },
    {
      "code": 6002,
      "name": "invalidContribution",
      "msg": "Invalid contribution amount"
    },
    {
      "code": 6003,
      "name": "memberNotFound",
      "msg": "Member not found"
    },
    {
      "code": 6004,
      "name": "poolNotActive",
      "msg": "Pool not active"
    },
    {
      "code": 6005,
      "name": "poolActive",
      "msg": "Pool is already active"
    },
    {
      "code": 6006,
      "name": "unauthorized",
      "msg": "unauthorized"
    },
    {
      "code": 6007,
      "name": "invalidPoolSize",
      "msg": "Invalid pool size - must be between 2 and 10 members"
    },
    {
      "code": 6008,
      "name": "insufficientFunds",
      "msg": "Insufficient funds for contribution"
    },
    {
      "code": 6009,
      "name": "invalidPayoutRecipient",
      "msg": "Invalid payout recipient"
    },
    {
      "code": 6010,
      "name": "invalidCyclePeriod",
      "msg": "Invalid cycle period or total cycles"
    },
    {
      "code": 6011,
      "name": "contributionAlreadyMade",
      "msg": "Contribution already made for this cycle"
    },
    {
      "code": 6012,
      "name": "invalidPayoutPosition",
      "msg": "Invalid payout position - must be between 1 and total members"
    },
    {
      "code": 6013,
      "name": "payoutPositionTaken",
      "msg": "Payout position already taken"
    }
  ],
  "types": [
    {
      "name": "currencyType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "sol"
          },
          {
            "name": "usdc"
          }
        ]
      }
    },
    {
      "name": "cyclePeriod",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "weekly"
          },
          {
            "name": "monthly"
          }
        ]
      }
    },
    {
      "name": "memberAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "pool",
            "type": "pubkey"
          },
          {
            "name": "hasCollected",
            "type": "bool"
          },
          {
            "name": "contributionsMade",
            "type": "u8"
          },
          {
            "name": "payoutPosition",
            "type": "u8"
          },
          {
            "name": "questionnaireAnswers",
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "vaultAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pool",
            "type": "pubkey"
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
  ]
};
