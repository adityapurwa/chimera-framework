# YAML Chain Semantic

Chimera is a Component Based Software Engineering Framework. In order to define the orchestration of the components, a YAML chain file is required.

All chain file should contains single `Root Process`. The semantic of YAML chain file is specified as follow:

__Note:__ Everything between `[` and `]` are optional, but everything between `<` and `>` are mandatory. For example, a `Root_process` might contains `vars: <Variable_declaration>`. On the other hand, any `vars:` should be followed by `Variable_declaration`

## Root_process

Complete `Root_process` is as follow:

```yaml
[vars: <Variable_declaration>]
[verbose: <Boolean>]
[<Process>]
```

## Boolean

Boolean has two possible value, `true` or `false`

```yaml
true
```

```yaml
false
```

## Variable_declaration

`Variable_declaration` consists of `Variable_name : Value` pairs

```yaml
<Variable_name> : <Value>
<Variable_name> : <Value>
...
```

## Variable_name

Any valid `String` can be used as `Variable_name`

```yaml
<String>
```

By default, chimera-framework has 3 default variables:

* `_ans` : If no `out` key specified in a `Process`, the default variable `_ans` will be used.
* `_init_cwd` : Contains absolute current working directory path.
* `_chain_cwd` : Contains absolute working directory path of current chain.

## Value

Any valid `String` can be used as `Value`

```yaml
<String>
```

## Process

There are several ways to write `Process`

```yaml
[ins: <Input>]
[out: <Output>]
[mode: <Mode>]
[if: <Condition>]
[chains:
    - <Process>
    - <Process>
    - ...]
[while: <Condition>]
[error: <Condition>]
[error_message: <String>]
[error_action:
    - <Process>
    - <Process>
    - ...]
```

```yaml
[ins: <Input>]
[out: <Output>]
[if: <Condition>]
[<Mode>:
    - <Process>
    - <Process>
    - ...]
[while: <Condition>]
[error: <Condition>]
[error_message: <String>]
[error_action:
    - <Process>
    - <Process>
    - ...]
```

```yaml
[ins: <Input>]
[out: <Output>]
[if: <Condition>]
[Command: <Command>]
[while: <Condition>]
[error: <Condition>]
[error_message: <String>]
[error_action:
    - <Process>
    - <Process>
    - ...]
```

`Process` can also be written in a single line

```yaml
(<Input>) -> <Command> -> <Output>
```

```yaml
(<Input>) -> <Command>
```

```yaml
<Command> -> <Output>
```

```yaml
(<Input>) ->-> <Output>
```

```yaml
(<input>) --> <Output>
```

__Note:__ without `Command` specified (i.e: when you use `(<Input>) ->-> <Output>` or `(<Input>) --> <Output>` syntax), the default command will be used (`(...args)=>{if(args.length==1){return args<0>;}else{return args;}}`). Thus the `Input` will be copied into `Output` directly.

## Mode

`Mode` is either `serial` or `parallel`

```yaml
series
```

```yaml
parallel
```

## Condition
Any Javascript that return a `<Boolean>` value.

## Input

`Input` is comma separated `Value` or `Variable_name`.

```yaml
<Variable_name>, <Variable_name>, <Variable_name>, ...
```

```yaml
"<Value>", "<Value>", "<Value>", ...
```

The combination of `Value` and `Variable_name` is also permitted.

```yaml
<Variable_name>, "<Value>", ...
```

## Output

```yaml
<Variable_name>
```

## Command

Any valid non-interactive command prompt program, javascript arrow function, and Javascript module name can be used as command.

Below are examples of valid non-interactive command prompt program:

```yaml
cal
```

```yaml
ls
```

```yaml
php your-script.php
```

```yaml
python your-script.py
```

```yaml
java -cp your-class
```

Javascript arrow function is a way to write anonymous function. For more information about arrow function, please visit [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions). Using arrow function is recommended if your `Command` only need to do a very simple operation. Performance based, Chimera-framework will parse arrow function faster than external command prompt programs

```Javascript
(input1, input2,... )=>{return something;}
```

You can also use a Javascript module as `Command`. Not only faster than external command prompt programs, Javacript module is also reusable compared to arrow function (i.e: you don't need to write the same function over and over again). However, the module should export function that takes callback as last parameter. For more information about this, please visit [advance example section](./doc.advance-example.md#javascript-module)

```yaml
[./your-module.js]
```

or

```yaml
[./your-module.js exported-function]
```
