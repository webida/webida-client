# webida-client

This is a web-based IDE that is made up of plugins on Open Development Platform.

## Installation Guide

Checkout and install [webida-server](https://github.com/webida/webida-server).

Generally [webida-client](https://github.com/webida/webida-client) always be installed with the 
[webida-server](https://github.com/webida/webida-server) installation process.

But if you want to upgrade [webida-client](https://github.com/webida/webida-client) version remotely,
checkout this repository and follow below instructions.
And send deploy request to the webida-server using deploy API with the access_token(`$TOKEN`).

```
$ cd webida-client
$ tar czpf - * | curl -k -X POST -F content=@- "http://webida.mine:5001/webida/api/app/deploy?appid=webida-client&access_token=$TOKEN"
```

you can find `$TOKEN` at the server's initial DB data.

```
$ mysql -u webida -p webida
mysql> select t.token from oauth_token t, mem_user u where t.user_id = u.user_id and u.`type` = 1;
+---------------------------+
| token                     |
+---------------------------+
| THIS_IS_A_TOKEN_STRING    | = This value is `$TOKEN`
+---------------------------+
1 row in set (0.00 sec)
```

Now you can access client app with the below url address.

* http://webida.mine:5001/
