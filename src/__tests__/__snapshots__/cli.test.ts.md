# Snapshot report for `src/__tests__/cli.test.ts`

## run cli --tasks

> Snapshot 1

    `␊
    Available tasks␊
    ␊
      a␊
      b                          This is some long description of b. It's pretty␊
                                 long, and goes into detail about why we want to do␊
                                 b.␊
      buildCompiler              This thing builds the compiler. Neat, right?␊
                                 Depends on: a, b, c␊
      c                          Depends on: b␊
      runSomeProgram (default)   Depends on: buildCompiler␊
    `

## run cli --tasks wide columns

> Snapshot 1

    `␊
    Available tasks␊
    ␊
      a␊
      b                          This is some long description of b. It's pretty long, and goes into detail about why we want to do b.␊
      buildCompiler              This thing builds the compiler. Neat, right?␊
                                 Depends on: a, b, c␊
      c                          Depends on: b␊
      runSomeProgram (default)   Depends on: buildCompiler␊
    `

## exception

> exitCode

    1
