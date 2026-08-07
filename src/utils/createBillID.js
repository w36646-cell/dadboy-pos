const SALES_KEY = "dadboy_sales_v1";

function readSales() {

  try {

    const saved =

      localStorage.getItem(SALES_KEY);

    return saved

      ? JSON.parse(saved)

      : [];

  } catch {

    return [];

  }

}

function pad2(number) {

  return String(number).padStart(2, "0");

}

function createDateCode(date) {

  const year = String(

    date.getFullYear()

  ).slice(-2);

  const month = pad2(

    date.getMonth() + 1

  );

  const day = pad2(

    date.getDate()

  );

  return `${year}${month}${day}`;

}

function createBillId() {

  const now = new Date();

  const dateCode =

    createDateCode(now);

  const prefix =

    `DB${dateCode}-`;

  const sales =

    readSales();

  const todayBills =

    sales.filter(

      (sale) =>

        String(

          sale.billId || ""

        ).startsWith(prefix)

    );

  let highestNumber = 0;

  todayBills.forEach(

    (sale) => {

      const numberPart =

        String(

          sale.billId

        ).replace(

          prefix,

          ""

        );

      const number =

        Number(numberPart);

      if (

        Number.isFinite(number) &&

        number >

          highestNumber

      ) {

        highestNumber =

          number;

      }

    }

  );

  const nextNumber =

    highestNumber + 1;

  return (

    prefix +

    String(nextNumber).padStart(

      4,

      "0"

    )

  );

}

export default createBillId;
 