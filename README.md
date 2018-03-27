# Open Ethereum Pool API Next

Extending the default API provided by the [sammy007/open-ethereum-pool](https://github.com/sammy007/open-ethereum-pool) project.

## Running this project

1. You need to provide a `config.json` file in the root of this project. An
example of the contents of this file:

```
{
  "api": {
    "port": 3000
  },
  "oldApi": {
    "host": "127.0.0.1",
    "port": 80
  },
  "redis": {
    "host": "127.0.0.1",
    "port": 6379
  }
}
```

2. Install [forever](https://github.com/foreverjs/forever) and
[screen](https://www.gnu.org/software/screen/).

3. Run the script `run-new-api.sh` to start the server.

4. Run the script `stop-new-api.sh` to stop the server.

5. Update the file `www/news.html` for latest news.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for more details.
