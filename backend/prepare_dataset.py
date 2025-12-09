import os
import shutil
import random

SOURCE_DIR = r"E:/java-chat-app/CivicX/backend/archive (2)"
TARGET_DIR = r"E:/java-chat-app/CivicX/backend/yolo_classification_dataset"

CLASSES = [
    "Damaged concrete structures",
    "DamagedElectricalPoles",
    "DamagedRoadSigns",
    "DeadAnimalsPollution",
    "FallenTrees",
    "Garbage",
    "Graffitti",
    "IllegalParking",
    "Potholes and RoadCracks"
]

os.makedirs(TARGET_DIR + "/train", exist_ok=True)
os.makedirs(TARGET_DIR + "/valid", exist_ok=True)

def collect_images(root):
    imgs = []
    for path, _, files in os.walk(root):
        for f in files:
            if f.lower().endswith((".jpg", ".png", ".jpeg")):
                full_path = os.path.join(path, f)
                if os.path.isfile(full_path):  # check if exists
                    imgs.append(full_path)
                else:
                    print(f"[WARNING] Missing file skipped: {full_path}")
    return imgs

for c in CLASSES:
    print(f"\nProcessing class: {c}")

    src = os.path.join(SOURCE_DIR, c)
    if not os.path.exists(src):
        print(f"[ERROR] Folder not found: {src}")
        continue

    images = collect_images(src)

    if len(images) == 0:
        print(f"[WARNING] No images found for {c}. Skipping.")
        continue

    random.shuffle(images)
    split = int(len(images) * 0.8)

    train_imgs = images[:split]
    valid_imgs = images[split:]

    os.makedirs(f"{TARGET_DIR}/train/{c}", exist_ok=True)
    os.makedirs(f"{TARGET_DIR}/valid/{c}", exist_ok=True)

    for img in train_imgs:
        try:
            shutil.copy(img, f"{TARGET_DIR}/train/{c}")
        except Exception as e:
            print(f"[ERROR copying] {img} -> {e}")

    for img in valid_imgs:
        try:
            shutil.copy(img, f"{TARGET_DIR}/valid/{c}")
        except Exception as e:
            print(f"[ERROR copying] {img} -> {e}")

print("\n🎉 Dataset conversion completed successfully!")
