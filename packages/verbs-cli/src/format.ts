const format = {
  bulletList(myArray: string[]) {
    let list = "";
    myArray.forEach((element) => {
      list = list.concat(`- ${element}\n`);
    });
    return list;
  },
};

export default format;
