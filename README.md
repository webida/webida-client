# webida-client

Web based IDE

## Installation Guide

1. Check out and install [webida-server](https://github.com/webida/webida-server)
2. You can find `$TOKEN` at the server's initial DB data.
3. Check out this repository.
4. Send deploy request to the webida-server with `$TOKEN`

```
# access the database 'webida'
$ mysql -u webida -p webida

mysql> select p.pid from webida_user as u inner join webida_policy as p on p.owner = u.uid and resource = "[\"app:*\"]" where u.isAdmin = 1;
+---------------------------+
| pid                       |
+---------------------------+
| ci5yszrqv0002wjm1od85oxcn |   # this is the $TOKEN value
+---------------------------+
mysql> exit
```

```
$cd webida-client
$tar czpf - * | curl -k -X POST -F content=@- "http://webida.mine/webida/api/app/deploy?appid=webida&access_token=$TOKEN"
```
