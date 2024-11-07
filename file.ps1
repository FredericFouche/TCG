# Création des dossiers principaux
$folders = @(
    "src",
    "src/core",
    "src/core/currency",
    "src/core/shop",
    "src/core/inventory",
    "src/core/collection",
    "src/core/booster",
    "src/features",
    "src/features/auto-clicker",
    "src/features/market",
    "src/features/achievements",
    "src/features/stats",
    "src/data",
    "src/data/cards",
    "src/data/save",
    "src/data/profile",
    "src/utils",
    "src/constants",
    "src/components",
    "src/components/ui",
    "src/components/cards",
    "src/components/boosters",
    "src/components/shop",
    "src/components/market",
    "src/components/collection",
    "src/services",
    "src/store",
    "src/workers",
    "public",
    "public/assets",
    "public/assets/images",
    "public/assets/cards",
    "public/assets/boosters",
    "tests",
    "docs"
)

# Création des fichiers de base
$files = @(
    "src/index.html",
    "src/index.js",
    "src/styles.css",
    "src/core/currency/CurrencySystem.js",
    "src/core/shop/Shop.js",
    "src/core/inventory/Inventory.js",
    "src/core/collection/Collection.js",
    "src/core/booster/BoosterSystem.js",
    "src/features/auto-clicker/AutoClickManager.js",
    "src/features/market/Market.js",
    "src/features/achievements/AchievementSystem.js",
    "src/features/stats/StatsManager.js",
    "src/data/cards/Card.js",
    "src/data/save/SaveManager.js",
    "src/data/profile/PlayerProfile.js",
    "src/utils/EventEmitter.js",
    "src/utils/LocalStorage.js",
    "src/constants/GameConfig.js",
    "src/constants/CardRarities.js",
    "src/store/index.js",
    "src/workers/AutoClickWorker.js",
    "package.json",
    "README.md",
    ".gitignore"
)

# Création des dossiers
foreach ($folder in $folders) {
    New-Item -ItemType Directory -Force -Path $folder
    Write-Host "Created directory: $folder"
}

# Création des fichiers
foreach ($file in $files) {
    New-Item -ItemType File -Force -Path $file
    Write-Host "Created file: $file"
}