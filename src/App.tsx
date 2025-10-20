import React, { useState } from "react";
import Papa from "papaparse";
import Encoding from "encoding-japanese";
import Hagaki from "./components/Hagaki";
import "./print.css";

type CsvRow = Record<string, string>;

export default function App() {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  /** CSV読み込み */
  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (!ev.target?.result) return;
      const sjis = new Uint8Array(ev.target.result as ArrayBuffer);
      const utf8 = Encoding.convert(sjis, { to: "UNICODE", from: "SJIS" });
      const text = Encoding.codeToString(utf8);

      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          const data = (res.data as CsvRow[]).filter((r) =>
            Object.values(r).some((v) => (v || "").trim() !== "")
          );
          setRows(data);
        },
        error: (err) => alert("CSV読込エラー: " + err.message),
      });
    };
    reader.readAsArrayBuffer(file);
  };

  /** 郵便番号整形 */
  const zip = (v?: string) => (v || "").replace(/\D/g, "").slice(0, 7);

  /** 自宅住所構築　番地・建物で改行 */
  const fullHomeAddr = (r: CsvRow) => {
    const pref = (r["自宅住所(都道府県)"] || "").trim();
    const city = (r["自宅住所(市区町村)"] || "").trim();
    const street = (r["自宅住所(番地等)"] || "").trim();
    const building = (r["自宅住所(建物名)"] || "").trim();

    // 改行を自然に入れる：市区町村までは1行、番地以降は次行
    let addr = `${pref} ${city} ${street}`;
    if (building) addr += `\n${building}`;
    return addr;
  };


  /** 連名1〜3（自宅欄）抽出 — 主姓と同じなら省略 */
  const extractJoints = (r: CsvRow) => {
    const mainLast = (r["氏名(姓)"] || "").trim();
    const joints = [];

    for (let i = 1; i <= 3; i++) {
      const lname = (r[`連名${i}(姓:自宅欄)`] || "").trim();
      const fname = (r[`連名${i}(名:自宅欄)`] || "").trim();
      const honor = (r[`連名${i}(敬称:自宅欄)`] || "様").trim();

      if (!lname && !fname) continue;

      joints.push({
        lastName: lname === mainLast ? "" : lname, // ✅ 主姓と同じなら省略
        firstName: fname,
        honorific: honor,
      });
    }

    return joints;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors">
      {/* ヘッダー */}
      <header className="p-4 border-b bg-white sticky top-0 z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print-hide">
        <h1 className="text-2xl font-bold tracking-tight">
          はがきデザインキット住所録印刷ツール
        </h1>
        <h2>はがきデザインキットで印刷していた住所を印刷するWebアプリです。</h2>
        <h3>使い方・注意</h3>
        <p>会社宛てには未対応・連名は2名まで動作確認しています。</p>
        <p>CSVファイルははがきデザインキットの宛名でエクスポートしたもの(ShiftJIS)のみ対応しています。</p>
        <p>2025/10/25現在、実際にプリンターで印刷しての動作確認はしていませんので自己責任でご利用ください。</p>
        <h3>謝辞</h3>
        <p>本アプリは以下の技術・ライブラリを利用して作成されています。開発者の皆様に感謝いたします。</p>
        <ul className="list-disc list-inside">
          <li>
            <a
              href="https://react.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              React
            </a>
          </li>
          <li>
            <a href="https://vite.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              Vite
            </a>
          </li>
          <li>
            <a
              href="https://www.papaparse.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              PapaParse
            </a>
          </li>
          <li>
            <a
              href="https://github.com/aikige/nenga_html_template"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              HTML+CSSによる宛名書きテンプレート
            </a>
          </li>
        </ul>
        <div className="flex flex-wrap gap-3 items-center">

          <label className="file-label">
            CSVファイルを選択
            <input
              type="file"
              accept=".csv"
              onChange={onFileSelected}
              hidden
            />
          </label>

          {/* 印刷ボタン */}
          <button
            onClick={() => window.print()}
            disabled={rows.length === 0}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-sm font-medium shadow transition-colors disabled:opacity-50"
          >
            印刷
          </button>
          {rows.length > 0 && (
            <p className="text-sm text-gray-600">{rows.length} 件の宛名を読み込みました。</p>
          )}
        </div>
      </header>

      {/* CSVリスト（折りたたみ） */}
      {rows.length > 0 && (
        <div className="px-6 py-4 border-b bg-white print-hide">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between w-full text-left font-semibold text-gray-700"
          >
            <span>CSV内容リスト（クリックで開閉）</span>
            <span className="text-xl">{isOpen ? "▲" : "▼"}</span>
          </button>
          {isOpen && (
            <div className="mt-6 rounded-xl border border-gray-300 bg-white shadow-sm overflow-hidden">
              {/* ヘッダー */}
              <div className="px-4 py-2 border-b border-gray-200 bg-gray-100 rounded-t-xl">
                <h3 className="text-sm font-semibold text-gray-700">宛名データ一覧</h3>
              </div>

              {/* テーブル本体 */}
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {[
                        "氏名(姓)",
                        "氏名(名)",
                        "郵便番号(自宅欄)",
                        "自宅住所(都道府県)",
                        "自宅住所(市区町村)",
                        "自宅住所(番地等)",
                        "自宅住所(建物名)",
                        "敬称",
                        "連名1(姓:自宅欄)",
                        "連名1(名:自宅欄)",
                        "連名1(姓名:自宅欄)",
                        "連名1(敬称:自宅欄)",
                        "連名2(姓:自宅欄)",
                        "連名2(名:自宅欄)",
                        "連名2(姓名:自宅欄)",
                        "連名2(敬称:自宅欄)",
                        "連名3(姓:自宅欄)",
                        "連名3(名:自宅欄)",
                        "連名3(姓名:自宅欄)",
                        "連名3(敬称:自宅欄)",
                        "カテゴリ",
                        "送受履歴",
                        "デザインキット住所ID",
                      ].map((header) => (
                        <th
                          key={header}
                          className="px-3 py-2 text-left font-medium text-gray-700 border-r border-gray-200 whitespace-nowrap"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {rows.map((r, i) => (
                      <tr
                        key={i}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {[
                          r["氏名(姓)"],
                          r["氏名(名)"],
                          r["郵便番号(自宅欄)"],
                          r["自宅住所(都道府県)"],
                          r["自宅住所(市区町村)"],
                          r["自宅住所(番地等)"],
                          r["自宅住所(建物名)"],
                          r["敬称"],
                          r["連名1(姓:自宅欄)"],
                          r["連名1(名:自宅欄)"],
                          r["連名1(姓名:自宅欄)"],
                          r["連名1(敬称:自宅欄)"],
                          r["連名2(姓:自宅欄)"],
                          r["連名2(名:自宅欄)"],
                          r["連名2(姓名:自宅欄)"],
                          r["連名2(敬称:自宅欄)"],
                          r["連名3(姓:自宅欄)"],
                          r["連名3(名:自宅欄)"],
                          r["連名3(姓名:自宅欄)"],
                          r["連名3(敬称:自宅欄)"],
                          r["カテゴリ"],
                          r["送受履歴"],
                          r["デザインキット住所ID"],
                        ].map((cell, j) => (
                          <td
                            key={j}
                            className="px-3 py-1 border-r border-gray-100 text-gray-800 truncate max-w-[180px]"
                          >
                            {cell || "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>


          )}
        </div>
      )}

      {/* プレビュー領域 */}
      <main id="preview-area" className="print-area px-4 py-8">
        {rows.map((r, i) => (
          <Hagaki
            key={i}
            postal={zip(r["郵便番号(自宅欄)"])}
            address={fullHomeAddr(r)}
            lastName={r["氏名(姓)"] || ""}
            firstName={r["氏名(名)"] || ""}
            honorific={(r["敬称"] || "様").trim()}
            joints={extractJoints(r)}
          />
        ))}
      </main>
    </div>
  );
}
