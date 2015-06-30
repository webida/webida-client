/*
 * Copyright (c) 2012-2015 S-Core Co., Ltd.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var mixIn = require("mout/object/mixIn")

function Rules() {}

Rules.prototype.add = function(rule, config, func) {
  if (typeof rule == "string") {
    if (typeof config == "function") {
      func = config
      config = {}
    }
    this[rule] = {
      name: rule,
      config: config,
      func: func
    }
  }
  else {
    this[rule.name] = {
      name: rule.name,
      config: rule.config,
      func: rule.func
    }
  }
}

Rules.prototype.extend = function(name, options) {
  if (typeof options == "function")
    options = options.call(this[name].config, this[name].config)
  mixIn(this[name].config, options)
}

module.exports = Rules
