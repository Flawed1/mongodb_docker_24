# Лабораторная работа 1
## Создание подсети
Создадим подсеть для контейнеров
```bash
podman network create mongo
```
## Конфигурация конфигурационных серверов
Запускаем конфигурационные сервера
```bash
podman-compose -f config_server/docker-compose.yaml up -d
```
Подключаемся к ```mongosh``` на одном из контейнеров
```bash
podman exec -it config1 mongosh mongodb://0.0.0.0:27017
```
Инициаизируем реплики
```javascript
rs.initiate(
    {
        _id: "config",
        configsvr: true,
        members: [
            { _id : 0, host : "config1:27017" },
            { _id : 1, host : "config2:27017" },
            { _id : 2, host : "config3:27017" }
        ]
    }
)
```
## Конфигурация шардов
Запускаем шарды
```bash
podman-compose -f shards/docker-compose.yaml up -d
```
Подключаемся к ```mongosh``` на одной из реплик первого шарда
```bash
podman exec -it shard1_1 mongosh mongodb://0.0.0.0:27017
```
Инициаизируем реплики первого шарда
```javascript
rs.initiate(
    {
        _id: "shard1",
        members: [
            { _id : 0, host : "shard1_1:27017" },
            { _id : 1, host : "shard1_2:27017" },
            { _id : 2, host : "shard1_3:27017" }
        ]
    }
)
```
Подключаемся к ```mongosh``` на одной из реплик второго шарда
```bash
podman exec -it shard2_1 mongosh mongodb://0.0.0.0:27017
```
Инициаизируем реплики второго шарда
```javascript
rs.initiate(
    {
        _id: "shard2",
        members: [
            { _id : 0, host : "shard2_1:27017" },
            { _id : 1, host : "shard2_2:27017" },
            { _id : 2, host : "shard2_3:27017" }
        ]
    }
)
```
## Конфигурация роутера
Запускаем роутер
```bash
podman-compose -f router/docker-compose.yaml up -d
```
Подключаемся к ```mongosh``` роутера
```bash
podman exec -it router mongosh mongodb://0.0.0.0:27017
```
Добавляем шарды
```javascript
sh.addShard(
    "shard1/shard1_1:27017,shard1_2:27017,shard1_3:27017"
)

sh.addShard(
    "shard2/shard2_1:27017,shard2_2:27017,shard2_3:27017"
)
```
Уменьшаем размер чанка до 1 мб
```javascript
use config

db.settings.updateOne( { _id: "chunksize" }, { $set: { _id: "chunksize", value: 1 } }, { upsert: true } )
```
Активируем шардирование для БД _"test"_.
```javascript
use test

sh.enableSharding("test")
```
Создаём коллекцию _"movies"_
```javascript
db.createCollection("movies")
```
## Импорт данных
Копируем данные в контейнер
```bash
podman cp ./movies.json router:/root/
```
Импорт данных в БД
```bash
podman exec -it router mongoimport --jsonArray --db test --collection movies --file /root/movies.json
```
## Шардирование и балансировка
Подключаемся к ```mongosh```
```bash
podman exec -it router mongosh mongodb://0.0.0.0:27017
```
Создаём индекс по году и выполняем шардирование по индексу
```javascript
db.movies.createIndex({year: "hashed"})

sh.shardCollection("test.movies",{year: "hashed"})
```
Проверяем статус балансировки
```javascript
sh.balancerCollectionStatus("test.movies")
```
Делим чанк
```javascript
sh.splitFind("test.movies", { "year": "1903" })
```
