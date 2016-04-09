# webida-client

**Webida** is an web-based Rich Client Platform. Based on plugin-system,
you can add your own feature by building your plugin. Also you can easily extend
new features just installing new plugins from others. Since 2012 Webida has been used in many projects such as 
JavaScript IDE, Graphic Editing Tool, Performance Monitoring Tool, IoT SDK and ETC.
You can try webida demo as guest mode **[https://webida.org](https://webida.org/pages/index.html#guest)**.

### Webida IDE Screen Shot

![image](https://cloud.githubusercontent.com/assets/7447396/11450399/15612d02-95e2-11e5-8887-6035671f740e.png)

### Webida Video Tutorial

[![webida video tutorial](https://img.youtube.com/vi/qvEEzuJ5kO4/0.jpg)](https://www.youtube.com/watch?v=qvEEzuJ5kO4)

### Webida Architecture Stack

![image2015-11-6 18-12-47](https://cloud.githubusercontent.com/assets/7447396/14353386/cb383c68-fd13-11e5-863d-f36735aad2b5.png)

### Installation Guide

Checkout and install [webida-server](https://github.com/webida/webida-server).

Generally [webida-client](https://github.com/webida/webida-client) always be installed with the 
[webida-server](https://github.com/webida/webida-server) installation process.

But if you want to upgrade [webida-client](https://github.com/webida/webida-client) version remotely,
checkout this repository and follow below instructions.
And send deploy request to the webida-server using deploy API with the access_token(`$TOKEN`).

```
$ cd webida-client
$ npm install
$ cd deploy
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
