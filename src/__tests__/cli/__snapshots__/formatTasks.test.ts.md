# Snapshot report for `src/__tests__/cli/formatTasks.test.ts`

## printTasks

> normal

    `␊
    Available tasks␊
    ␊
      a             This is task a. It works pretty well.␊
      c             This is task c. This is task c. This is task c. This is task c.␊
                    This is task c. This is task c. This is task c. This is task c.␊
                    This is task c. This is task c.␊
                    Depends on: a, b␊
      d (default)␊
    `

> simple

    `a␊
    c␊
    d`

## wraps long descriptions across lines

> Snapshot 1

    `␊
    Available tasks␊
    ␊
      a   word word word word word␊
          word word word word word␊
          word word word word word␊
          word word word word word␊
    `

## wraps at hyphens in descriptions

> Snapshot 1

    `␊
    Available tasks␊
    ␊
      a   compile-and-run-all-the-␊
          tests-now␊
    `

## breaks long words in descriptions

> Snapshot 1

    `␊
    Available tasks␊
    ␊
      a   supercalifragilisti␊
          cexpialidocious␊
    `

## breaks long words after short words

> Snapshot 1

    `␊
    Available tasks␊
    ␊
      a   hi␊
          supercalifragilisti␊
          cexpialidocious␊
    `

## handles multiline descriptions

> Snapshot 1

    `␊
    Available tasks␊
    ␊
      a   Line one␊
          Line two␊
    `

## handles task with no description

> Snapshot 1

    `␊
    Available tasks␊
    ␊
      a␊
    `

## formats dependencies in description

> Snapshot 1

    `␊
    Available tasks␊
    ␊
      dep␊
      main   Depends on: dep␊
    `

## handles astral characters in task names

> Snapshot 1

    `␊
    Available tasks␊
    ␊
      😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀   description␊
    `
