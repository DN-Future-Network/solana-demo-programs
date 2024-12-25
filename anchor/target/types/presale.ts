/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/presale.json`.
 */
export type Presale = {
  "address": "HzSvVixk8DzPE3wwL1UgAGWV5krBVKRUpxFwdqn72hAv",
  "metadata": {
    "name": "presale",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Presale SPL Token with Anchor"
  },
  "instructions": [
    {
      "name": "buyToken",
      "discriminator": [
        138,
        127,
        14,
        91,
        38,
        87,
        115,
        105
      ],
      "accounts": [
        {
          "name": "mintAccount",
          "writable": true
        },
        {
          "name": "presaleInfo",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  80,
                  82,
                  69,
                  83,
                  65,
                  76,
                  69,
                  95,
                  83,
                  69,
                  69,
                  68
                ]
              }
            ]
          }
        },
        {
          "name": "userInfo",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  85,
                  83,
                  69,
                  82,
                  95,
                  83,
                  69,
                  69,
                  68
                ]
              }
            ]
          }
        },
        {
          "name": "presaleVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  80,
                  82,
                  69,
                  83,
                  65,
                  76,
                  69,
                  95,
                  86,
                  65,
                  85,
                  76,
                  84
                ]
              },
              {
                "kind": "account",
                "path": "presaleInfo"
              }
            ]
          }
        },
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "quoteAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claimToken",
      "discriminator": [
        116,
        206,
        27,
        191,
        166,
        19,
        0,
        73
      ],
      "accounts": [
        {
          "name": "mintAccount",
          "writable": true
        },
        {
          "name": "toAssociatedTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "buyer"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mintAccount"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "fromAssociatedTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "presaleInfo"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mintAccount"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "userInfo",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  85,
                  83,
                  69,
                  82,
                  95,
                  83,
                  69,
                  69,
                  68
                ]
              }
            ]
          }
        },
        {
          "name": "presaleInfo",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  80,
                  82,
                  69,
                  83,
                  65,
                  76,
                  69,
                  95,
                  83,
                  69,
                  69,
                  68
                ]
              }
            ]
          }
        },
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
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
      "name": "createPresale",
      "discriminator": [
        176,
        144,
        197,
        158,
        61,
        119,
        75,
        135
      ],
      "accounts": [
        {
          "name": "presaleInfo",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  80,
                  82,
                  69,
                  83,
                  65,
                  76,
                  69,
                  95,
                  83,
                  69,
                  69,
                  68
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
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
          "name": "tokenMintAddress",
          "type": "pubkey"
        },
        {
          "name": "softcapAmount",
          "type": "u64"
        },
        {
          "name": "hardcapAmount",
          "type": "u64"
        },
        {
          "name": "maxTokenAmountPerAddress",
          "type": "u64"
        },
        {
          "name": "pricePerToken",
          "type": "u64"
        },
        {
          "name": "startTime",
          "type": "u64"
        },
        {
          "name": "endTime",
          "type": "u64"
        }
      ]
    },
    {
      "name": "depositToken",
      "discriminator": [
        11,
        156,
        96,
        218,
        39,
        163,
        180,
        19
      ],
      "accounts": [
        {
          "name": "mintAccount",
          "writable": true
        },
        {
          "name": "fromAssociatedTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mintAccount"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "toAssociatedTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "presaleInfo"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mintAccount"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "presaleVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  80,
                  82,
                  69,
                  83,
                  65,
                  76,
                  69,
                  95,
                  86,
                  65,
                  85,
                  76,
                  84
                ]
              },
              {
                "kind": "account",
                "path": "presaleInfo"
              }
            ]
          }
        },
        {
          "name": "presaleInfo",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  80,
                  82,
                  69,
                  83,
                  65,
                  76,
                  69,
                  95,
                  83,
                  69,
                  69,
                  68
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "presaleInfo"
          ]
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "startPresale",
      "discriminator": [
        57,
        19,
        73,
        191,
        195,
        254,
        45,
        223
      ],
      "accounts": [
        {
          "name": "presaleInfo",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  80,
                  82,
                  69,
                  83,
                  65,
                  76,
                  69,
                  95,
                  83,
                  69,
                  69,
                  68
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "startTime",
          "type": "u64"
        },
        {
          "name": "endTime",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updatePresale",
      "discriminator": [
        9,
        223,
        20,
        184,
        183,
        199,
        90,
        226
      ],
      "accounts": [
        {
          "name": "presaleInfo",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  80,
                  82,
                  69,
                  83,
                  65,
                  76,
                  69,
                  95,
                  83,
                  69,
                  69,
                  68
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "presaleInfo"
          ]
        }
      ],
      "args": [
        {
          "name": "maxTokenAmountPerAddress",
          "type": "u64"
        },
        {
          "name": "pricePerToken",
          "type": "u64"
        },
        {
          "name": "softcapAmount",
          "type": "u64"
        },
        {
          "name": "hardcapAmount",
          "type": "u64"
        },
        {
          "name": "startTime",
          "type": "u64"
        },
        {
          "name": "endTime",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawSol",
      "discriminator": [
        145,
        131,
        74,
        136,
        65,
        137,
        42,
        38
      ],
      "accounts": [
        {
          "name": "presaleInfo",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  80,
                  82,
                  69,
                  83,
                  65,
                  76,
                  69,
                  95,
                  83,
                  69,
                  69,
                  68
                ]
              }
            ]
          }
        },
        {
          "name": "presaleVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  80,
                  82,
                  69,
                  83,
                  65,
                  76,
                  69,
                  95,
                  86,
                  65,
                  85,
                  76,
                  84
                ]
              },
              {
                "kind": "account",
                "path": "presaleInfo"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "presaleInfo"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "withdrawToken",
      "discriminator": [
        136,
        235,
        181,
        5,
        101,
        109,
        57,
        81
      ],
      "accounts": [
        {
          "name": "mintAccount",
          "writable": true
        },
        {
          "name": "toAssociatedTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mintAccount"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "fromAssociatedTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "presaleInfo"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mintAccount"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "presaleInfo",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  80,
                  82,
                  69,
                  83,
                  65,
                  76,
                  69,
                  95,
                  83,
                  69,
                  69,
                  68
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "presaleInfo"
          ]
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
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
  ],
  "accounts": [
    {
      "name": "presaleInfo",
      "discriminator": [
        11,
        19,
        36,
        47,
        79,
        104,
        214,
        40
      ]
    },
    {
      "name": "userInfo",
      "discriminator": [
        83,
        134,
        200,
        56,
        144,
        56,
        10,
        62
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "You are not authorized to perform this action."
    },
    {
      "code": 6001,
      "name": "notAllowed",
      "msg": "Not allowed"
    },
    {
      "code": 6002,
      "name": "mathOverflow",
      "msg": "Math operation overflow"
    },
    {
      "code": 6003,
      "name": "alreadyMarked",
      "msg": "Already marked"
    },
    {
      "code": 6004,
      "name": "presaleNotStarted",
      "msg": "Presale not started yet"
    },
    {
      "code": 6005,
      "name": "presaleEnded",
      "msg": "Presale already ended"
    },
    {
      "code": 6006,
      "name": "tokenAmountMismatch",
      "msg": "Token amount mismatch"
    },
    {
      "code": 6007,
      "name": "insufficientFund",
      "msg": "Insufficient Tokens"
    },
    {
      "code": 6008,
      "name": "presaleNotEnded",
      "msg": "Presale not ended yet"
    },
    {
      "code": 6009,
      "name": "hardCapped",
      "msg": "Presale already ended"
    }
  ],
  "types": [
    {
      "name": "presaleInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenMintAddress",
            "type": "pubkey"
          },
          {
            "name": "softcapAmount",
            "type": "u64"
          },
          {
            "name": "hardcapAmount",
            "type": "u64"
          },
          {
            "name": "depositTokenAmount",
            "type": "u64"
          },
          {
            "name": "soldTokenAmount",
            "type": "u64"
          },
          {
            "name": "startTime",
            "type": "u64"
          },
          {
            "name": "endTime",
            "type": "u64"
          },
          {
            "name": "maxTokenAmountPerAddress",
            "type": "u64"
          },
          {
            "name": "pricePerToken",
            "type": "u64"
          },
          {
            "name": "isLive",
            "type": "bool"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "isSoftCapped",
            "type": "bool"
          },
          {
            "name": "isHardCapped",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "userInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "buyQuoteAmount",
            "type": "u64"
          },
          {
            "name": "buyTokenAmount",
            "type": "u64"
          },
          {
            "name": "buyTime",
            "type": "u64"
          },
          {
            "name": "claimTime",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "presaleSeed",
      "type": "bytes",
      "value": "[80, 82, 69, 83, 65, 76, 69, 95, 83, 69, 69, 68]"
    }
  ]
};
