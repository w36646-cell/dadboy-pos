function SyncStatus({

  isOnline,

  cloudReady,

  pendingSaleCount,

  pendingStockCount,

}) {

  const hasPending =

    Number(

      pendingSaleCount || 0

    ) > 0 ||

    Number(

      pendingStockCount || 0

    ) > 0;

  let syncText =

    "";

  let statusBackground =

    "#ecfdf3";

  let statusBorder =

    "#abefc6";

  let statusColor =

    "#067647";

  let dotColor =

    "#12b76a";

  if (!isOnline) {

    syncText =

      "ออฟไลน์ · บันทึกข้อมูลไว้ในเครื่อง";

    statusBackground =

      "#fff7ed";

    statusBorder =

      "#fed7aa";

    statusColor =

      "#9a3412";

    dotColor =

      "#f97316";

  } else if (

    hasPending

  ) {

    const parts = [];

    if (

      Number(

        pendingSaleCount

      ) > 0

    ) {

      parts.push(

        `${pendingSaleCount} บิล`

      );

    }

    if (

      Number(

        pendingStockCount

      ) > 0

    ) {

      parts.push(

        `${pendingStockCount} Stock`

      );

    }

    syncText =

      `ออนไลน์ · รอ Sync ${parts.join(

        " / "

      )}`;

    statusBackground =

      "#fffaeb";

    statusBorder =

      "#fedf89";

    statusColor =

      "#93370d";

    dotColor =

      "#f79009";

  } else if (

    cloudReady

  ) {

    syncText =

      "ออนไลน์ · Sync เรียบร้อย";

  } else {

    syncText =

      "ออนไลน์ · กำลังเชื่อมต่อ Cloud";

    statusBackground =

      "#eff8ff";

    statusBorder =

      "#b2ddff";

    statusColor =

      "#175cd3";

    dotColor =

      "#2e90fa";

  }

  return (
<div

      style={{

        display:

          "flex",

        alignItems:

          "center",

        gap:

          "8px",

        padding:

          "8px 12px",

        borderRadius:

          "999px",

        background:

          statusBackground,

        border:

          `1px solid ${statusBorder}`,

        color:

          statusColor,

        fontSize:

          "13px",

        fontWeight:

          "700",

        whiteSpace:

          "nowrap",

      }}
>
<span

        style={{

          width:

            "9px",

          height:

            "9px",

          borderRadius:

            "999px",

          background:

            dotColor,

          display:

            "inline-block",

          flexShrink:

            0,

        }}

      />

      {syncText}
</div>

  );

}

export default SyncStatus;
 