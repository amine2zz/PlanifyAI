# 🎯 PLANIFY - Générateur de Planning Intelligent avec IA

Planify est une application web intelligente qui utilise l'IA pour créer des plannings optimisés à partir de créneaux horaires et de responsabilités vocales.

## ✨ Fonctionnalités IA

- **🎤 Reconnaissance vocale** : Dictez vos tâches et disponibilités
- **🧠 Analyse intelligente** : IA qui comprend vos responsabilités
- **📅 Suggestions optimales** : Recommandations de créneaux selon le type de tâche
- **⏰ Planification automatique** : Calendrier généré selon vos priorités
- **🎯 Optimisation contextuelle** : Horaires adaptés (focus, réunions, sport)
- **📊 Export intelligent** : Sauvegarde avec métadonnées IA

## 🚀 Installation

1. Cloner le projet
2. Installer les dépendances :
```bash
pip install -r requirements.txt
```

3. Lancer l'application :
```bash
python app.py
```

4. Ouvrir http://localhost:5000 dans votre navigateur

## 🧪 Tests

Exécuter les tests unitaires :
```bash
pytest test_planify.py -v
```

## 📋 Utilisation

1. **Ajouter des créneaux** : Sélectionnez un jour et définissez les heures
2. **Générer le planning** : Cliquez sur "Générer le planning"
3. **Exporter** : Téléchargez le planning au format JSON

## 🛠️ Technologies

- **Backend** : Python Flask
- **Frontend** : HTML5, CSS3, JavaScript
- **Tests** : Pytest
- **Format** : JSON

## 📁 Structure

```
Planify/
├── app.py              # Application Flask
├── templates/
│   └── index.html      # Interface utilisateur
├── static/
│   ├── style.css       # Styles CSS
│   └── script.js       # Logique JavaScript
├── test_planify.py     # Tests unitaires
├── requirements.txt    # Dépendances Python
└── README.md          # Documentation
```

## 🎯 Cas d'usage

- **Étudiants** : Organisation des révisions
- **Employés** : Définition des disponibilités
- **Gestionnaires** : Planification des réunions