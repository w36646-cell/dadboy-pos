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

    "Sync";

  let statusClass =

    "ready";

  if (!isOnline) {

    syncText =

      "ออฟไลน์";

    statusClass =

      "offline";

  } else if (

    hasPending

  ) {

    syncText =

      "รอ Sync";

    statusClass =

      "pending";

  } else if (

    cloudReady

  ) {

    syncText =

      "ออนไลน์ · Sync เรียบร้อย";

    statusClass =

      "ready";

  } else {

    syncText =

      "กำลัง Sync";

    statusClass =

      "connecting";

  }

  return (
<div

      className={`pos-sync-pill ${statusClass}`}
>
<span className="pos-sync-dot" />
<span>

        {syncText}
</span>
</div>

  );

}

export default SyncStatus;
 