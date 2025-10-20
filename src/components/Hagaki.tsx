import React from "react";
import styles from "../hagaki_style.module.css";

type Joint = {
  lastName: string;
  firstName: string;
  honorific?: string;
};

type Props = {
  postal: string;         // 7桁
  address: string;        // 住所（縦書き）
  lastName: string;       // 主宛名（姓）
  firstName: string;      // 主宛名（名）
  honorific: string;      // 敬称（様 等）
  joints?: Joint[];       // 連名（任意）
};

function wrapAddress(address: string): string {
  const maxLen = 20;
  const parts = address.split(/\n+/);
  const wrappedLines: string[] = [];
  for (const part of parts) {
    const chars = [...part];
    for (let i = 0; i < chars.length; i += maxLen) {
      wrappedLines.push(chars.slice(i, i + maxLen).join(""));
    }
  }
  return wrappedLines.join("\n");
}

/** はがき1枚の宛名面（A6 100×148mm） */
const Hagaki: React.FC<Props> = ({
  postal,
  address,
  lastName,
  firstName,
  honorific,
  joints = [],
}) => {
  const pc3 = postal.slice(0, 3);
  const pc4 = postal.slice(3);
  const formattedAddress = wrapAddress(address);

  // 主宛名 + jointsをまとめる
  const allFirstNames = [firstName, ...joints.map((j) => j.firstName)];
  const allHonorifics = [honorific, ...joints.map((j) => j.honorific || "様")];

  return (
    <section className={styles.page}>
      {/* 郵便番号 */}
      <div className={styles.postal3}>{pc3}</div>
      <div className={styles.postal4}>{pc4}</div>

      {/* 住所 */}
      <div className={styles.address}>
        {formattedAddress.split("\n").map((line, i) => (
          <React.Fragment key={i}>
            {line}
            <br />
          </React.Fragment>
        ))}
      </div>

      {/* 宛名 */}
      <div className={styles.to_name}>
        <div className={styles.to_family_name}>{lastName}</div>
        <div className={styles.to_first_name}>
          {allFirstNames.map((n, i) => (
            <React.Fragment key={i}>
              {n}
              {i < allFirstNames.length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
        <div className={styles.to_name_suffix}>
          {allHonorifics.map((s, i) => (
            <React.Fragment key={i}>
              {s}
              {i < allHonorifics.length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hagaki;
