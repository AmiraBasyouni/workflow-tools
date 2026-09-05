const format = {
  bulletList(myArray: string[], indentCount: number) {
    const indent = " ".repeat(indentCount);
    let list = "";
    myArray.forEach((element) => {
      const lines = element.split("\n");
      list = list.concat(`${indent}- ${lines[0]}\n`);

      // For each additional line:
      const dashIndent = "  ";
      lines.slice(1).forEach((line) => {
        list = list.concat(`${indent}${dashIndent}${line}\n`);
      });
    });
    return list;
  },
  numberedList(myArray: string[], indentCount: number) {
    const indent = " ".repeat(indentCount);
    let list = "";
    myArray.forEach((element, index) => {
      const lines = element.split("\n");
      const number = index + 1;
      list = list.concat(`${indent}${number}. ${lines[0]}\n`);

      // For each additional line:
      const numberWidth = String(number).length;
      const numberIndent = " ".repeat(numberWidth) + "  ";
      lines.slice(1).forEach((line) => {
        list = list.concat(`${indent}${numberIndent}${line}\n`);
      });
    });
    return list;
  },
};

export default format;
