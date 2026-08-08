function pad2(number) {

  return String(number).padStart(

    2,

    "0"

  );

}

function createDateCode(date) {

  const year =

    String(

      date.getFullYear()

    ).slice(-2);

  const month =

    pad2(

      date.getMonth() + 1

    );

  const day =

    pad2(

      date.getDate()

    );

  return `${year}${month}${day}`;

}

function createTimeCode(date) {

  const hour =

    pad2(

      date.getHours()

    );

  const minute =

    pad2(

      date.getMinutes()

    );

  const second =

    pad2(

      date.getSeconds()

    );

  return `${hour}${minute}${second}`;

}

function createRandomCode() {

  /*

    ใช้ crypto ถ้า Browser รองรับ

    เพื่อให้หลายเครื่องสร้างเลขบิล

    พร้อมกันแล้วไม่ชนกัน

  */

  if (

    typeof crypto !==

      "undefined" &&

    typeof crypto.getRandomValues ===

      "function"

  ) {

    const values =

      new Uint32Array(1);

    crypto.getRandomValues(

      values

    );

    return values[0]

      .toString(36)

      .toUpperCase()

      .slice(-3)

      .padStart(

        3,

        "0"

      );

  }

  /*

    fallback สำหรับ Browser เก่า

  */

  return Math.random()

    .toString(36)

    .slice(2, 5)

    .toUpperCase()

    .padEnd(

      3,

      "0"

    );

}

function createBillId() {

  const now =

    new Date();

  const dateCode =

    createDateCode(now);

  const timeCode =

    createTimeCode(now);

  const randomCode =

    createRandomCode();

  return (

    `DB${dateCode}-` +

    `${timeCode}-` +

    randomCode

  );

}

export default createBillId;
 