sh.addShard(
    "shard1/shard1_1:27017,shard1_2:27017,shard1_3:27017"
)

sh.addShard(
    "shard2/shard2_1:27017,shard2_2:27017,shard2_3:27017"
)

sh.status()
