import { diffLines, type Change } from "diff";

import { DiffLine } from "..";

export function convertMyersChangeToDiffLines(change: Change): DiffLine[] {
  const type: DiffLine["type"] = change.added
    ? "new"
    : change.removed
      ? "old"
      : "same";
  const lines = change.value.split("\n");

  // Ignore the \n at the end of the final line, if there is one
  if (lines[lines.length - 1] === "") {
    lines.pop();
  }

  return lines.map((line) => ({ type, line }));
}

// The interpretation of lines in oldContent and newContent is the same as jsdiff
// Lines are separated by \n, with the exception that a trailing \n does *not*
// represent an empty line.
//
// The default for jsdiff is that "foo" and "foo\n" are *different* single-line
// contents, but we can't represent that: to avoid a diff
// [ { type: "old", line: "foo" }, { type: "new", line: "foo" } ], we
// pass ignoreNewlineAtEof: true.
export function myersDiff(oldContent: string, newContent: string): DiffLine[] {
  const theirFormat = diffLines(oldContent, newContent, {
    ignoreNewlineAtEof: true,
  });
  let ourFormat = theirFormat.flatMap(convertMyersChangeToDiffLines);

  // Combine consecutive old/new pairs that are identical after trimming
  for (let i = 0; i < ourFormat.length - 1; i++) {
    if (
      ourFormat[i]?.type === "old" &&
      ourFormat[i + 1]?.type === "new" &&
      ourFormat[i].line.trim() === ourFormat[i + 1].line.trim()
    ) {
      ourFormat[i] = { type: "same", line: ourFormat[i].line };
      ourFormat.splice(i + 1, 1);
    }
  }

  // Remove trailing empty old lines
  while (
    ourFormat.length > 0 &&
    ourFormat[ourFormat.length - 1].type === "old" &&
    ourFormat[ourFormat.length - 1].line === ""
  ) {
    ourFormat.pop();
  }

  return ourFormat;
}
