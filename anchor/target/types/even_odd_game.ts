/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/even_odd_game.json`.
 */
export type EvenOddGame = {
  "address": "AE4H2WjxmL8HKkefPffGbFYa5w97MgDVtnJG2UdCzX6x",
  "metadata": {
    "name": "evenOddGame",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Even Odd Game with Anchor"
  },
  "instructions": [
    {
      "name": "claimReward",
      "discriminator": [
        149,
        95,
        181,
        242,
        94,
        90,
        158,
        162
      ],
      "accounts": [
        {
          "name": "gameAccount",
          "writable": true
        },
        {
          "name": "playerAccount"
        },
        {
          "name": "vaultAccount",
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
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "createGame",
      "discriminator": [
        124,
        69,
        75,
        66,
        184,
        220,
        72,
        206
      ],
      "accounts": [
        {
          "name": "gameAccount",
          "writable": true
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "gameCounterAccount"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "gameCounterAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "vaultAccount",
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
      "args": []
    },
    {
      "name": "joinGame",
      "discriminator": [
        107,
        112,
        18,
        38,
        56,
        173,
        60,
        128
      ],
      "accounts": [
        {
          "name": "gameAccount",
          "writable": true
        },
        {
          "name": "playerAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "gameAccount"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "vaultAccount",
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
          "name": "isEvenBet",
          "type": "bool"
        },
        {
          "name": "betAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "startGame",
      "discriminator": [
        249,
        47,
        252,
        172,
        184,
        162,
        245,
        14
      ],
      "accounts": [
        {
          "name": "gameAccount",
          "writable": true
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "game",
      "discriminator": [
        27,
        90,
        166,
        125,
        74,
        100,
        121,
        18
      ]
    },
    {
      "name": "gameCounter",
      "discriminator": [
        117,
        67,
        148,
        185,
        138,
        194,
        249,
        87
      ]
    },
    {
      "name": "player",
      "discriminator": [
        205,
        222,
        112,
        7,
        165,
        155,
        206,
        218
      ]
    },
    {
      "name": "vault",
      "discriminator": [
        211,
        8,
        232,
        43,
        2,
        152,
        117,
        119
      ]
    }
  ],
  "events": [
    {
      "name": "gameEvent",
      "discriminator": [
        154,
        5,
        234,
        245,
        78,
        248,
        61,
        153
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "randomnessNotResolved",
      "msg": "Randomness Not Resolved"
    },
    {
      "code": 6001,
      "name": "depositFailed",
      "msg": "Deposit failed"
    },
    {
      "code": 6002,
      "name": "gameAlreadyEnded",
      "msg": "Game already ended"
    },
    {
      "code": 6003,
      "name": "notAuthority",
      "msg": "Not authority"
    },
    {
      "code": 6004,
      "name": "gameNotEnd",
      "msg": "Game has not ended"
    },
    {
      "code": 6005,
      "name": "lost",
      "msg": "You lost"
    }
  ],
  "types": [
    {
      "name": "game",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gameId",
            "type": "u64"
          },
          {
            "name": "result",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "reward",
            "type": "u64"
          },
          {
            "name": "playerCount",
            "type": "u64"
          },
          {
            "name": "evenBetCount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "gameCounter",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "counter",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "gameEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "player",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "player",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "bet",
            "type": "bool"
          },
          {
            "name": "betAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "vault",
      "type": {
        "kind": "struct",
        "fields": []
      }
    }
  ],
  "constants": [
    {
      "name": "gameSeed",
      "type": "bytes",
      "value": "[103, 97, 109, 101]"
    },
    {
      "name": "lamportPerSol",
      "type": "u64",
      "value": "1000000000"
    },
    {
      "name": "playerSeed",
      "type": "bytes",
      "value": "[112, 108, 97, 121, 101, 114]"
    },
    {
      "name": "vaultSeed",
      "type": "bytes",
      "value": "[118, 97, 117, 108, 116]"
    }
  ]
};
