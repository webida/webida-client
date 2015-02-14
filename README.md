# webida-client

Web based IDE

## Installation Guide

* Check out and install [webida-server](https://github.com/webida/webida-server)
* You can find `$TOKEN` at the server's initial DB data.

```
$ mongo
> use webida_auth
> db.tokens.find({uid: 100000}, {token: 1, _id: 0})
{ "token" : "thisIsATokenString" }  # this is the $TOKEN
```

* Check out this repository.
* Send deploy request to the webida-server with `$TOKEN`

```
$cd webida-client
$tar czpf - * | curl -k -X POST -F content=@- "http://webida.mine:5001/webida/api/app/deploy?appid=webida-client&access_token=$TOKEN"
```

* You can access client app with below address.

```
http://webida.mine:5001/
```