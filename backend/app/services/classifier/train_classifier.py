"""
Train Document Type Classifier (ResNet18) for ARGUS Module 1.
Trains on representative document layouts across:
- PASSPORT
- VISA
- DRIVING_LICENSE
- NATIONAL_ID
- PERMIT

Saves trained weights to 'doc_classifier.pth' in the same directory.
"""

import os
import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import torchvision.models as models
import torchvision.transforms as transforms

DOC_CLASSES = ["PASSPORT", "VISA", "DRIVING_LICENSE", "NATIONAL_ID", "PERMIT"]
CLASS_TO_IDX = {c: i for i, c in enumerate(DOC_CLASSES)}

def generate_synthetic_document(doc_type: str, img_size=(224, 224)) -> np.ndarray:
    """Generates synthetic document layout images with realistic geometric & texture features."""
    w, h = img_size
    img = np.ones((h, w, 3), dtype=np.uint8) * 240
    
    if doc_type == "PASSPORT":
        # Darker booklet background, photo on left, distinct dark MRZ band on bottom 25%
        img[:, :] = (210, 220, 230)
        # Passport header
        cv2.rectangle(img, (20, 15), (w - 20, 40), (80, 50, 20), -1)
        # Photo box
        cv2.rectangle(img, (20, 50), (80, 140), (160, 160, 160), -1)
        cv2.circle(img, (50, 85), 20, (120, 120, 120), -1)
        # Text lines
        for y in range(55, 140, 14):
            cv2.line(img, (95, y), (w - 25, y), (70, 70, 70), 2)
        # Dark MRZ strip at bottom
        cv2.rectangle(img, (10, 165), (w - 10, h - 10), (30, 30, 30), -1)
        for y in [180, 200]:
            cv2.line(img, (20, y), (w - 20, y), (200, 200, 200), 2)

    elif doc_type == "VISA":
        # Greenish/patterned visa background with guilloche lines and rectangular frame
        img[:, :] = (220, 240, 225)
        cv2.rectangle(img, (10, 10), (w - 10, h - 10), (50, 120, 60), 2)
        cv2.rectangle(img, (25, 20), (w - 25, 45), (40, 100, 50), -1)
        # Photo
        cv2.rectangle(img, (20, 55), (75, 130), (150, 150, 150), -1)
        # Text fields
        for y in range(60, 150, 15):
            cv2.line(img, (85, y), (w - 25, y), (80, 80, 80), 2)
        # Stamp circle in bottom corner
        cv2.circle(img, (w - 55, h - 45), 25, (160, 60, 50), 2)

    elif doc_type == "DRIVING_LICENSE":
        # Card aspect ratio, top color banner, vehicle class grid
        img[:, :] = (245, 240, 230)
        cv2.rectangle(img, (10, 10), (w - 10, 42), (180, 90, 30), -1) # Blue/orange state banner
        # Photo
        cv2.rectangle(img, (20, 52), (80, 135), (140, 140, 140), -1)
        # License details
        for y in range(55, 120, 13):
            cv2.line(img, (90, y), (w - 20, y), (60, 60, 60), 2)
        # Vehicle categories table/grid at bottom
        cv2.rectangle(img, (20, 145), (w - 20, h - 18), (100, 100, 100), 1)
        cv2.line(img, (w // 2, 145), (w // 2, h - 18), (100, 100, 100), 1)

    elif doc_type == "NATIONAL_ID":
        # Modern ID card, national emblem circle, chip/barcode box
        img[:, :] = (235, 242, 248)
        # Top header
        cv2.rectangle(img, (15, 12), (w - 15, 38), (40, 80, 140), -1)
        # Photo
        cv2.rectangle(img, (20, 50), (75, 125), (150, 150, 150), -1)
        # Emblem
        cv2.circle(img, (w - 45, 75), 18, (180, 140, 40), 2)
        # Fields
        for y in range(55, 145, 14):
            cv2.line(img, (85, y), (w - 60, y), (70, 70, 70), 2)
        # Micro-chip rectangle
        cv2.rectangle(img, (25, 150), (60, 185), (180, 170, 70), -1)

    elif doc_type == "PERMIT":
        # Residence / travel permit with multi-column layout and authority seal
        img[:, :] = (240, 235, 245)
        cv2.rectangle(img, (12, 12), (w - 12, 36), (120, 40, 90), -1)
        # Two-column text blocks
        for y in range(50, 160, 16):
            cv2.line(img, (25, y), (w // 2 - 15, y), (80, 80, 80), 2)
            cv2.line(img, (w // 2 + 10, y), (w - 25, y), (80, 80, 80), 2)
        # Official seal at bottom center
        cv2.circle(img, (w // 2, h - 35), 20, (130, 40, 100), 2)

    # Random subtle noise & lighting variations for robustness
    noise = np.random.normal(0, 4, img.shape).astype(np.int16)
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    return img

class SyntheticDocumentDataset(Dataset):
    def __init__(self, num_samples_per_class=120, transform=None):
        self.samples = []
        self.transform = transform
        for cls_name in DOC_CLASSES:
            for _ in range(num_samples_per_class):
                img = generate_synthetic_document(cls_name)
                self.samples.append((img, CLASS_TO_IDX[cls_name]))
                
    def __len__(self):
        return len(self.samples)
        
    def __getitem__(self, idx):
        img_bgr, label = self.samples[idx]
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        if self.transform:
            img_tensor = self.transform(img_rgb)
        else:
            img_tensor = transforms.ToTensor()(img_rgb)
        return img_tensor, label

def train_model():
    print("Preparing dataset for Document Type Classifier...")
    transform = transforms.Compose([
        transforms.ToPILImage(),
        transforms.RandomRotation(5),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    dataset = SyntheticDocumentDataset(num_samples_per_class=100, transform=transform)
    dataloader = DataLoader(dataset, batch_size=32, shuffle=True)
    
    print(f"Dataset generated: {len(dataset)} images across {len(DOC_CLASSES)} classes.")
    
    print("Initializing ResNet18 backbone...")
    model = models.resnet18(weights=None)
    model.fc = nn.Linear(model.fc.in_features, len(DOC_CLASSES))
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    model.train()
    print("Training for 6 epochs...")
    for epoch in range(6):
        running_loss = 0.0
        correct = 0
        total = 0
        for inputs, labels in dataloader:
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * inputs.size(0)
            _, predicted = torch.max(outputs, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
            
        epoch_loss = running_loss / total
        epoch_acc = correct / total
        print(f"Epoch {epoch+1}/6 - Loss: {epoch_loss:.4f} - Accuracy: {epoch_acc:.2%}")
        
    out_dir = os.path.dirname(__file__)
    out_path = os.path.join(out_dir, "doc_classifier.pth")
    torch.save(model.state_dict(), out_path)
    print(f"Model saved successfully to: {out_path}")
    print(f"File size: {os.path.getsize(out_path) / (1024*1024):.2f} MB")

if __name__ == "__main__":
    train_model()
