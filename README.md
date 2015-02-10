# webida-client

Web based IDE

## Installation Guide

1. Check out and install [webida-server](https://github.com/webida/webida-server)
2. You can find `$TOKEN` at the server's initial DB data.
3. Check out this repository.
4. Send deploy request to the webida-server with `$TOKEN`

```
$ mongo
> use webida_auth
> db.tokens.find({uid: 100000}, {token: 1, _id: 0})
{ "token" : "thisIsATokenString" }
```

```
$cd webida-client
$tar czpf - * | curl -k -X POST -F content=@- "http://webida.mine/webida/api/app/deploy?appid=webida&access_token=thisIsATokenString"
```