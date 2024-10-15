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

## Конфигурация роутера
## Импорт данных
Копируем данные в контейнер
```bash
podman cp ./movies.json router:/root/
```
Импорт данных в БД
```bash
podman exec -it router mongoimport --jsonArray --db test --collection movies --file /root/movies.json
```
Подключаемся к ```mongosh```
```bash
podman exec -it router mongosh mongodb://0.0.0.0:27017
```
