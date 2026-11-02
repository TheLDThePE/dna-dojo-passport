r"""
resize_photos.py  -  ย่อรูปพนักงานก่อนอัปโหลดขึ้น Supabase Storage

ทำอะไร
  1. อ่านรูปทั้งหมดจากโฟลเดอร์ต้นทาง (รูปต้นฉบับ ไม่ถูกแก้ไข)
  2. หมุนรูปให้ตรง, ครอปเป็นสี่เหลี่ยมจัตุรัส (เน้นส่วนบนของรูปเพื่อไม่ให้ตัดหน้า)
  3. ย่อเป็น 256 x 256 พิกเซล บันทึกเป็น JPEG ชื่อ <EmpNo>.jpg ลงโฟลเดอร์ปลายทาง
  4. ทำรายงาน: คนในรายชื่อที่ไม่มีรูป / ไฟล์ที่ชื่อไม่ตรงกับ EmpNo / ไฟล์ที่เปิดไม่ได้
     (รายงานเก็บไว้ในโฟลเดอร์แม่ของโฟลเดอร์ปลายทาง ชื่อมีชื่อโฟลเดอร์ปลายทางต่อท้าย จึงไม่ทับรายงานชุดก่อน)

วิธีรัน (PowerShell ที่โฟลเดอร์โปรเจกต์)
  pip install pillow

  # รูปชุดแรก (ใช้ค่าเริ่มต้นด้านล่าง)
  python scripts\resize_photos.py

  # รูปชุดใหม่: ระบุ โฟลเดอร์รูป  โฟลเดอร์ผลลัพธ์  ไฟล์รายชื่อ(CSV ที่มีคอลัมน์ emp_no)
  python scripts\resize_photos.py "C:\User DATA\ld_img_new" "C:\User DATA\ld_img_new_small" "supabase\data\qa_employees.csv"
"""

import argparse
import csv
import sys
from pathlib import Path

from PIL import Image, ImageOps

# ======================= ค่าเริ่มต้น (แก้ได้) =======================
DEFAULT_SRC = r"C:\User DATA\ld_img"                    # โฟลเดอร์รูปต้นฉบับ
DEFAULT_DST = r"C:\User DATA\ld_img_small"              # โฟลเดอร์ผลลัพธ์ (สร้างให้เอง)
DEFAULT_CSV = r"C:\User DATA\ldna-dojo-passport\supabase\data\employees_import.csv"
SIZE = 256                                              # ขนาดด้านละกี่พิกเซล
QUALITY = 82                                            # คุณภาพ JPEG (1-95)
FACE_BIAS = 0.25                                        # 0 = ครอปกลางภาพ, 0.25 = เอียงไปทางบน
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
# ====================================================================


def load_emp_nos(csv_path: Path):
    """อ่านรายชื่อ EmpNo จากไฟล์ CSV (ถ้าไม่มีไฟล์ จะข้ามขั้นตรวจสอบรายชื่อ)"""
    if not csv_path.exists():
        return None
    with open(csv_path, encoding="utf-8-sig", newline="") as f:
        return [row["emp_no"].strip() for row in csv.DictReader(f) if row.get("emp_no")]


def to_square(img: Image.Image) -> Image.Image:
    """ครอปเป็นจัตุรัส ถ้าเป็นรูปแนวตั้งให้เอียงไปทางส่วนบน (ที่มักเป็นใบหน้า)"""
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = int((h - side) * FACE_BIAS) if h > w else (h - side) // 2
    return img.crop((left, top, left + side, top + side))


def process(src_file: Path, dst_file: Path):
    with Image.open(src_file) as im:
        im = ImageOps.exif_transpose(im)  # แก้รูปที่ถ่ายแล้วกลับหัว/ตะแคง
        if im.mode in ("RGBA", "LA", "P"):
            im = im.convert("RGBA")
            bg = Image.new("RGB", im.size, (255, 255, 255))
            bg.paste(im, mask=im.split()[-1])
            im = bg
        else:
            im = im.convert("RGB")
        im = to_square(im).resize((SIZE, SIZE), Image.Resampling.LANCZOS)
        im.save(dst_file, "JPEG", quality=QUALITY, optimize=True)


def mb(n_bytes: int) -> str:
    return f"{n_bytes / 1024 / 1024:.1f} MB"


def main():
    ap = argparse.ArgumentParser(description="ย่อรูปพนักงานเป็น 256x256 ตั้งชื่อตาม EmpNo")
    ap.add_argument("src", nargs="?", default=DEFAULT_SRC, help="โฟลเดอร์รูปต้นฉบับ")
    ap.add_argument("dst", nargs="?", default=DEFAULT_DST, help="โฟลเดอร์ผลลัพธ์")
    ap.add_argument("csv", nargs="?", default=DEFAULT_CSV, help="ไฟล์ CSV รายชื่อ (คอลัมน์ emp_no)")
    args = ap.parse_args()
    src, dst, csv_path = Path(args.src), Path(args.dst), Path(args.csv)

    if not src.exists():
        sys.exit(f"ไม่พบโฟลเดอร์รูปต้นฉบับ: {src}")

    emp_list = load_emp_nos(csv_path)
    emp_lookup = {e.upper(): e for e in emp_list} if emp_list else None
    if emp_lookup is None:
        print(f"[หมายเหตุ] ไม่พบไฟล์ {csv_path}\n"
              "          จะย่อรูปให้ แต่ข้ามการตรวจว่าใครไม่มีรูป/ชื่อไฟล์ไม่ตรง\n")

    dst.mkdir(parents=True, exist_ok=True)
    files = sorted(p for p in src.rglob("*") if p.is_file() and p.suffix.lower() in EXTS)
    print(f"พบไฟล์รูป {len(files)} ไฟล์ใน {src}\n")

    done = {}          # EmpNo -> ไฟล์ต้นฉบับที่ใช้
    unmatched = []     # ชื่อไฟล์ที่ไม่ตรงกับ EmpNo ใดเลย
    duplicates = []    # EmpNo เดียวกันมีหลายไฟล์
    broken = []        # เปิดไฟล์ไม่ได้
    src_bytes = 0
    out_bytes = 0

    for i, f in enumerate(files, 1):
        stem = f.stem.strip()
        if emp_lookup is not None:
            emp_no = emp_lookup.get(stem.upper())
            if emp_no is None:
                unmatched.append(f.name)
                continue
        else:
            emp_no = stem.upper()

        if emp_no in done:
            duplicates.append(f"{emp_no}: {done[emp_no].name} และ {f.name} (ใช้ไฟล์แรก)")
            continue

        out_file = dst / f"{emp_no}.jpg"
        try:
            process(f, out_file)
        except Exception as e:  # noqa: BLE001
            broken.append(f"{f.name}: {e}")
            continue

        done[emp_no] = f
        src_bytes += f.stat().st_size
        out_bytes += out_file.stat().st_size
        if i % 100 == 0:
            print(f"  ... ประมวลผลแล้ว {i}/{len(files)}")

    # ---------- รายงาน ----------
    missing = []
    if emp_list is not None:
        missing = [e for e in emp_list if e not in done]

    report_dir = dst.parent
    report_dir.mkdir(parents=True, exist_ok=True)
    missing_file = report_dir / f"report_missing_photos_{dst.name}.txt"
    unmatched_file = report_dir / f"report_unmatched_files_{dst.name}.txt"
    missing_file.write_text("\n".join(missing), encoding="utf-8")
    unmatched_file.write_text("\n".join(unmatched), encoding="utf-8")

    print("\n================ สรุป ================")
    print(f"ย่อสำเร็จ                : {len(done)} รูป  -> {dst}")
    print(f"ขนาดรวมต้นฉบับ (ที่ใช้)   : {mb(src_bytes)}")
    print(f"ขนาดรวมหลังย่อ           : {mb(out_bytes)}")
    if done:
        print(f"เฉลี่ยต่อรูปหลังย่อ       : {out_bytes / len(done) / 1024:.0f} KB")
    if emp_list is not None:
        print(f"คนในรายชื่อ               : {len(emp_list)} คน")
        print(f"คนในรายชื่อที่ไม่มีรูป     : {len(missing)} คน  ({missing_file.name})")
        print(f"ไฟล์ที่ชื่อไม่ตรงรายชื่อ   : {len(unmatched)} ไฟล์ ({unmatched_file.name})")
    print(f"EmpNo ที่มีไฟล์ซ้ำ         : {len(duplicates)}")
    print(f"ไฟล์ที่เปิดไม่ได้          : {len(broken)}")
    for line in duplicates[:10]:
        print("   ซ้ำ  ->", line)
    for line in broken[:10]:
        print("   เสีย ->", line)
    if unmatched:
        print("ตัวอย่างไฟล์ชื่อไม่ตรง   :", ", ".join(unmatched[:10]))
    if missing:
        print("คนที่ไม่มีรูป             :", ", ".join(missing[:10]))
    print(f"\nรายงานเต็มอยู่ที่ {report_dir}")


if __name__ == "__main__":
    main()
