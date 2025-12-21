from ultralytics import YOLO

def main():
    model = YOLO("yolov8m-cls.pt")

    model.train(
        data="E:/java-chat-app/CivicX/backend/yolo_classification_dataset",
        epochs=50,
        imgsz=224,
        batch=16,
        device=0,
        name="civicx_cls_model",
        workers=0,    # IMPORTANT FOR WINDOWS
    )

if __name__ == "__main__":
    main()
  