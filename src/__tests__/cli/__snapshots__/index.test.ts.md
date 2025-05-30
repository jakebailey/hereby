# Snapshot report for `src/__tests__/cli/index.test.ts`

The actual snapshot is saved in `index.test.ts.snap`.

Generated by [AVA](https://avajs.dev).

## main usage

> Snapshot 1

    [
      [
        'log',
        `␊
        hereby␊
        ␊
          A simple task runner. ␊
        ␊
        Synopsis␊
        ␊
          $ hereby <task> ␊
        ␊
        Options␊
        ␊
          -h, --help          Display this usage guide.               ␊
          --herebyfile path   A path to a Herebyfile. Optional.       ␊
          -T, --tasks         Print a listing of the available tasks. ␊
          --version           Print the current hereby version.       ␊
        ␊
        Example usage␊
        ␊
          $ hereby build                             ␊
          $ hereby build lint                        ␊
          $ hereby test --skip someTest --lint=false ␊
          $ hereby --tasks                           ␊
        `,
      ],
    ]

## main print tasks

> Snapshot 1

    [
      [
        'log',
        `␊
        Available tasks␊
        ␊
          a                                                                             ␊
          b                          This is some long description of b. It's pretty    ␊
                                     long, and goes into detail about why we want to do ␊
                                     b.                                                 ␊
          buildCompiler              This thing builds the compiler. Neat, right?       ␊
                                     Depends on: a, b, c                                ␊
          c                          Depends on: b                                      ␊
          runSomeProgram (default)   Depends on: buildCompiler                          ␊
        `,
      ],
    ]

## main success

> Snapshot 1

    [
      [
        'log',
        'Using ~/simplified/cliTest.mjs to run success',
      ],
      [
        'log',
        'Starting success',
      ],
      [
        'log',
        'Finished success in <pretty-ms>',
      ],
      [
        'log',
        'Completed success in <pretty-ms>',
      ],
    ]

## main failure

> Snapshot 1

    [
      [
        'log',
        'Using ~/simplified/cliTest.mjs to run failure',
      ],
      [
        'log',
        'Starting failure',
      ],
      [
        'log',
        'Completed failure with errors in <pretty-ms>',
      ],
      [
        'log',
        'Failed tasks: failure',
      ],
    ]

## multi failure

> Snapshot 1

    [
      [
        'log',
        'Using ~/simplified/cliTest.mjs to run multiple:failures',
      ],
      [
        'log',
        'Starting failure',
      ],
      [
        'log',
        'Completed multiple:failures with errors in <pretty-ms>',
      ],
      [
        'log',
        'Failed tasks: failure, other:failure',
      ],
    ]

## main user error

> Snapshot 1

    [
      [
        'error',
        'Error: Task "oops" does not exist or is not exported from ~/simplified/cliTest.mjs.',
      ],
    ]
