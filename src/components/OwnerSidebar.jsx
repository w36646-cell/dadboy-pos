import {

  useState,

} from "react";

import "./OwnerSidebar.css";

import { supabase } from "../lib/supabase";

function OwnerSidebar({

  currentPage,

  onChangePage,

  onLogout,

}) {

  const [

    mobileOpen,

    setMobileOpen,

  ] = useState(false);

  const menuItems = [

    {

      id: "dashboard",

      icon: "📊",

      label: "Dashboard",

    },

    {

      id: "pos",

      icon: "🛒",

      label: "ขายสินค้า",

    },

    {

      id: "products",

      icon: "📦",

      label: "จัดการสินค้า",

    },

    {

      id: "stock",

      icon: "📥",

      label: "รับสินค้าเข้า",

    },

    {

      id: "stock-adjustment",

      icon: "🧮",

      label: "ปรับสต๊อก",

    },

    {

      id: "reports",

      icon: "📈",

      label: "รายงาน",

    },

    {

      id: "bills",

      icon: "🧾",

      label: "บิลย้อนหลัง",

    },

    {

      id: "settings",

      icon: "🧹",

      label: "พื้นที่ในเครื่อง",

    },

  ];

  function selectPage(

    page

  ) {

    onChangePage(

      page

    );

    setMobileOpen(

      false

    );

  }

  function logout() {

    setMobileOpen(

      false

    );

    onLogout();

  }

async function changeOwnerPin() {

  const oldPin =

    window.prompt(

      "กรุณาใส่ PIN ปัจจุบัน"

    );

  if (oldPin === null) {

    return;

  }


  if (

    !/^\d{4}$/.test(oldPin)

  ) {

    window.alert(

      "PIN ปัจจุบันต้องเป็นตัวเลข 4 หลัก"

    );

    return;

  }


  const newPin =

    window.prompt(

      "กรุณาใส่ PIN ใหม่ 4 หลัก"

    );

  if (newPin === null) {

    return;

  }


  if (

    !/^\d{4}$/.test(newPin)

  ) {

    window.alert(

      "PIN ใหม่ต้องเป็นตัวเลข 4 หลัก"

    );

    return;

  }


  if (newPin === oldPin) {

    window.alert(

      "PIN ใหม่ต้องไม่เหมือน PIN เดิม"

    );

    return;

  }


  const confirmPin =

    window.prompt(

      "กรุณายืนยัน PIN ใหม่อีกครั้ง"

    );

  if (confirmPin === null) {

    return;

  }


  if (

    confirmPin !== newPin

  ) {

    window.alert(

      "PIN ใหม่ทั้งสองครั้งไม่ตรงกัน"

    );

    return;

  }


  try {

    const {

      data,

      error,

    } =

      await supabase.rpc(

        "change_owner_pin",

        {

          p_current_pin:

            oldPin,

          p_new_pin:

            newPin,

        }

      );


    if (error) {

      throw error;

    }


    if (data !== true) {

      window.alert(

        "PIN ปัจจุบันไม่ถูกต้อง"

      );

      return;

    }


    /*

      ลบ PIN รุ่นเก่า

      ที่เคยเก็บไว้ในเครื่อง

    */

    localStorage.removeItem(

      "dadboy_owner_pin"

    );


    window.alert(

      "เปลี่ยน PIN เรียบร้อยแล้ว\nPIN ใหม่จะใช้กับทุกเครื่อง"

    );


  } catch (error) {

    console.error(

      "Change owner PIN error:",

      error

    );

    window.alert(

      "เปลี่ยน PIN ไม่สำเร็จ\nกรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่"

    );

  }

}
  
  return (
<>
<button

        type="button"

        className="owner-mobile-menu-button"

        onClick={() =>

          setMobileOpen(

            (current) =>

              !current

          )

        }

        aria-label="เปิดเมนูเจ้าของร้าน"
>

        ☰
</button>

      {mobileOpen && (
<div

          className="owner-sidebar-backdrop"

          onClick={() =>

            setMobileOpen(

              false

            )

          }

        />

      )}
<aside

        className={

          mobileOpen

            ? "owner-sidebar mobile-open"

            : "owner-sidebar"

        }
>
<div className="owner-sidebar-header">
<div>
<strong>

              Dadboy POS
</strong>
<span>

              โหมดเจ้าของร้าน
</span>
</div>
<button

            type="button"

            className="owner-sidebar-close"

            onClick={() =>

              setMobileOpen(

                false

              )

            }

            aria-label="ปิดเมนู"
>

            ×
</button>
</div>
<nav className="owner-sidebar-menu">

          {menuItems.map((item) => (
  <div key={item.id}>
    <button
      type="button"
      className={
        currentPage === item.id
          ? "owner-sidebar-item active"
          : "owner-sidebar-item"
      }
      onClick={() => selectPage(item.id)}
    >
      <span className="owner-sidebar-icon">
        {item.icon}
      </span>

      <span>
        {item.label}
      </span>
    </button>

    {item.id === "pos" && (
      <div
        className="owner-sidebar-search-slot"
        id="owner-sidebar-search-slot"
      />
    )}
  </div>
))}
  
</nav>
<div className="owner-sidebar-bottom">
<button

  type="button"

  className="owner-sidebar-change-pin"

  onClick={

    changeOwnerPin

  }
>
<span>

    🔐
</span>
<span>

    เปลี่ยน PIN
</span>
</button>

<button

  type="button"

  className="owner-sidebar-logout"

            onClick={

              logout

            }
>
<span>

              🚪
</span>
<span>

              ออกจากโหมดเจ้าของ
</span>
</button>
</div>
</aside>
</>

  );

}

export default OwnerSidebar;
 
