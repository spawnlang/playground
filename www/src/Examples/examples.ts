import { LocalCodeRepository } from "../Repositories";
import { RunConfigurationType } from "../RunConfigurationManager/RunConfigurationManager";

export interface IExample {
    name: string
    code: string
    runConfiguration: RunConfigurationType
}

export const examples: IExample[] = [
    {
        name: "Hello, Playground!",
        code: LocalCodeRepository.WELCOME_CODE,
        runConfiguration: RunConfigurationType.Run
    },
    {
        name: "String interpolation",
        code: `
module main

fn main() {
    // In Spawn you can define array of string with the following syntax:
    users := ['John', 'Ania', 'Patrik', 'Jannie']

    // Spawn uses the \${} notation to interpolate a variable
    // or expression right on the string.
    // Learn more about string interpolation in the documentation:
    // https://docs.spawnlang.dev/concepts/types/strings.html#string-interpolation
    for user in users {
        println('Hello, \${user}!')
    }
}
`,
        runConfiguration: RunConfigurationType.Run
    },
    {
        name: "Fibonacci",
        code: `
module main

// As in other languages, you can define functions in Spawn.
// Learn more about functions in the documentation:
// https://docs.spawnlang.dev/concepts/functions/overview.html
fn fib(n i32) -> u64 {
    // To define a array of specific type, use the following syntax.
    // Here we define an array of int with the length of n + 2.
    // Learn more about arrays in the documentation:
    // https://docs.spawnlang.dev/concepts/types/arrays.html
    mut f := []u64{len: n + 2}

    f[0] = 0
    f[1] = 1

    for i in 2 ..= n {
        f[i] = f[i - 1] + f[i - 2]
    }

    return f[n]
}

// main function is the entry point of the program.
// See note about the main function in the documentation:
// https://docs.spawnlang.dev/getting-started/hello-world.html
fn main() {
    for i in 0 .. 30 {
        println(fib(i))
    }
}
`,
        runConfiguration: RunConfigurationType.Run
    },
    {
        name: "Structs and embedded structs",
        code: `
module main

// Structs are a way to define a new type with a set of fields.
// You can define a struct with the following syntax.
// Learn more about structs in the documentation:
// https://docs.spawnlang.dev/concepts/structs/overview.html
struct Size {
    width  i32
    height i32
}

// Structs can have methods.
fn (s &Size) area() -> i32 {
    return s.width * s.height
}

// Structs can be embedded in other structs.
// Conceptually, embedded structs are similar to composition in OOP, not base classes.
struct Button {
    Size

    title string
}

fn main() {
    mut button := Button{
        title: 'Click me'
        height: 2
    }

    button.width = 3

    // With embedding, the struct Button will automatically have get all the
    // fields and methods from the struct Size, which allows you to do:
    assert button.area() == 6

    // If you need to access embedded structs directly, use an explicit
    // reference like \`button.Size\`:
    assert button.Size.area() == 6

    print(button)
}
`,
        runConfiguration: RunConfigurationType.Run
    },
    {
        name: "Sum types",
        code: `
module main

struct Empty {}

struct Node {
    value f64
    left  &Tree
    right &Tree
}

// Sum types are a way to define a type that can be one of several types.
// In Spawn, sum types are defined with following syntax.
// Learn more about sum types in the documentation:
// https://docs.spawnlang.dev/concepts/sum-types.html
union Tree = Empty | Node

// Let's calculate the sum of all values in the tree.
fn main() {
    left := Node{
        value: 0.2
        left: &(Empty{} as Tree)
        right: &(Empty{} as Tree)
    }

    right := Node{
        value: 0.3
        left: &(Empty{} as Tree)
        right: &(Node{
            value: 0.4
            left: &(Empty{} as Tree)
            right: &(Empty{} as Tree)
        } as Tree)
    }

    // Here we just define a tree with some values.
    tree := Node{
        value: 0.5
        left: &(left as Tree)
        right: &(right as Tree)
    }

    // And call the sum function.
    // Since the sum function accepts a Tree, we can pass it any of the
    // possible types of the Tree sum type.
    // In this case, we pass it a Node.
    println(sum(tree)) // 0.2 + 0.3 + 0.4 + 0.5 = 1.4
}

// sum up all node values
fn sum(tree Tree) -> f64 {
    // In Spawn, you can use \`match\` expression to match a value against a sum type.
    // Learn more about match expression in the documentation:
    // https://docs.spawnlang.dev/concepts/control-flow/conditions.html#match-expression
    return match tree {
        // if the value has type Empty, return 0
        Empty -> 0

        // if the value has type Node, return the sum of the node value and the sum of the left and right subtrees
        Node -> tree.value + sum(*tree.left) + sum(*tree.right)
    }
}
`,
        runConfiguration: RunConfigurationType.Run
    },
    {
        name: "Generics",
        code: `
module main

// Sometimes there may be situations where you need code that will
// work in the same way for different types.
//
// For example, in this example, we are creating a \`List\` that will
// be able to store elements of any type while maintaining type safety.
//
// In Spawn, to define a generic structure, you need to write the generic parameters
// in square brackets after name.
// There may be one or more of them, each of them must be named with a
// single capital letter.
//
// Learn more about generics in the documentation:
// https://docs.spawnlang.dev/concepts/generics.html
struct List[T] {
    data []T
}

// Since the \`List\` structure is generic, we can define methods that accept or
// return the type with which the structure was created.
//
// That is, for each \`List\` with a specific type, its own copy of this structure
// will be created when Spawn compile code.
//
// This means that if you call push on a \`List[int]\`, then the \`push()\` function will
// take an int argument.
fn (mut l List[T]) push(val T) {
    l.data.push(val)
}

// Here everything is the same as with \`push()\`, however, for \`List[int]\` the function
// will return an int value, and not accept it.
fn (l &List[T]) pop() -> T {
    return l.data.last()
}

fn (l List[T]) str() -> string {
    return l.data.str()
}

// In Spawn, there can be not only structures, but also functions, so the following function
// creates a generic structure with the type passed to the function.
fn list_of[T]() -> List[T] {
    return List[T]{}
}

fn main() {
    // Let's create a new \`List\` that will contain the strings:
    mut string_list := List[string]{}
    //                     ^^^^^^^^ Generic arguments to create a struct
    // Here we have passed a string as the T parameter to the struct.
    // We can say that this code is equivalent to \`List_string{}\`, where
    // \`List_string\` has a data field with type \`[]string\`.

    // Methods are called as usual, the compiler will understand
    // that \`push()\` takes a value of type string.
    string_list.push('hello')
    string_list.push('world')

    // When you call \`pop()\`, the compiler will understand that the method returns a string.
    last_string := string_list.pop()
    println(last_string)

    // Now let's create a new \`List\` but which stores bool.
    // We use our \`list_of()\` function for this.
    mut bool_list := list_of[bool]()
    //                      ^^^^^^ Generic arguments to call the function.
    // Here, as for \`List\`, we passed arguments to be used instead of T.
    // The compiler itself will compute and understand that it is necessary
    // to create a \`List\` with the bool type.

    bool_list.push(true)
    println(bool_list)
}
`,
        runConfiguration: RunConfigurationType.Run
    },
    {
        name: "Concurrency",
        code: `
// Learn more about concurrency in the documentation:
// https://docs.spawnlang.dev/concepts/concurrency.html
module main

import time
import runtime

fn task(id i32, duration u64) {
    println('task \${id} begin')
    time.sleep(duration * time.MILLISECOND)
    println('task \${id} end')
}

fn main() {
    // []runtime.Handle[unit] is a special type that represents an array of threads in our case
    mut threads := []&runtime.Handle[unit]{}

    // \`spawn\` starts a new thread and returns a \`runtime.Handle[unit]\` object
    // that can be added in thread array.
    threads.push(spawn task(1, 500))
    threads.push(spawn task(2, 900))
    threads.push(spawn task(3, 100))

    for thread in threads {
        thread.join()
    }

    println('done')
}
`,
        runConfiguration: RunConfigurationType.Run
    },
    {
        name: "Channel Select",
        code: `
// Channels in Spawn very similar to Go's channels.
// Learn more about channels in the documentation:
// https://docs.spawnlang.dev/concepts/concurrency.html#channels
module main

import time

fn main() {
    // Channels is a special type that represents a communication channel between threads.
    ch := chan f64{}
    //         ^^^ type of data that can be sent or received through the channel
    ch2 := chan f64{}
    ch3 := chan f64{}
    mut b := 0.0
    c := 1.0

    // Setup spawn threads that will send on ch/ch2.
    spawn fn (the_channel chan f64) {
        time.sleep(5 * time.MILLISECOND)
        // You can push value to channel...
        the_channel <- 1.0
    }(ch)

    spawn fn (the_channel chan f64) {
        time.sleep(1 * time.MILLISECOND)
        // ...in different threads.
        the_channel <- 1.0
    }(ch2)

    spawn fn (the_channel chan f64) {
        // And read values from channel in other threads
        // If channel is empty, the thread will wait until a value is pushed to it.
        _ = <-the_channel
    }(ch3)

    // Select is powerful construct that allows you to work for multiple channels.
    // Learn more about select in the documentation:
    // https://docs.spawnlang.dev/concepts/concurrency.html#channel-select
    select {
        a := <-ch => eprintln('> a: \${a}')
        b = <-ch2 => eprintln('> b: \${b}')
        ch3 <- c => {
            // do something if \`c\` was sent
            time.sleep(5 * time.MILLISECOND)
            eprintln('> c: \${c} was sent on channel ch3')
        }
        500 * time.MILLISECOND => eprintln('> more than 0.5s passed without a channel being ready')
    }

    eprintln('> done')
}

`,
        runConfiguration: RunConfigurationType.Run
    },
    {
        name: "JSON Encoding/Decoding",
        code: `
// Spawn very modular and has a lot of built-in modules.
// In this example we will use the json module to encode and decode JSON data.
// If you want to learn more about modules, visit
// https://docs.spawnlang.dev/concepts/modules/overview.html
module main

import json

// Since Spawn is statically typed, we need to define a struct to hold the data.
// Learn more about structs in the documentation:
// https://docs.spawnlang.dev/concepts/structs/overview.html
struct User {
    name string
    age  i32
    // We can use the \`mut\` keyword to make the field mutable.
    // Without it, there is no way to change the field value.
    is_registered bool
}

fn main() {
    json_data := '[{"name":"Frodo", "age":25}, {"name":"Bobby", "age":10}]'

    // json.decode() is special function that can decode JSON data.
    // It takes a type and a json data as arguments and returns a value of passed type.
    // Spawn tries to decode the data as the passed type. For example, if you pass []User,
    // it will try to decode the data as an array of User.
    //
    // In this case it will return an array of User.
    //
    // Learn more about the json module in the documentation:
    // https://docs.spawnlang.dev/concepts/working-with-json.html
    mut users := json.decode[[]User](json_data) or {
        // But if the json data is invalid, it will return an error.
        // You can handle it with the 'or {}' syntax as in this example.
        //
        // err is a special variable that contains the error message.
        //
        // Learn more about error handling in documentation:
        // https://docs.spawnlang.dev/concepts/error-handling.html
        eprintln('Failed to parse json, error: \${err}')
        return
    }

    for user in users {
        // See 'String interpolation' example to learn more about the \${} notation.
        println('\${user.name}: \${user.age}')
    }
    println('')

    for i, mut user in users {
        println('\${i}) \${user.name}')
        if !user.can_register() {
            println('Cannot register \${user.name}, they are too young')
            continue
        }

        // \`user\` is declared as \`mut\` in the for loop,
        // modifying it will modify the array
        user.register()
    }

    println('')

    // json.encode() is a special function that can encode a value to JSON.
    // It takes a value and returns a JSON string.
    //
    // It always return a string, so you don't need to handle the error.
    encoded_data := json.encode(users)
    println(encoded_data)
}

fn (u User) can_register() -> bool {
    return u.age >= 16
}

fn (mut u User) register() {
    u.is_registered = true
}

// Output:
// Frodo: 25
// Bobby: 10
//
// 0) Frodo
// 1) Bobby
// Cannot register Bobby, they are too young
//
// [{"name":"Frodo","age":25,"is_registered":true},{"name":"Bobby","age":10,"is_registered":false}]
`,
        runConfiguration: RunConfigurationType.Run
    },
    {
        name: "Filter Log file",
        code: `
// Print file lines that start with "DEBUG:"
module main

import os

fn main() {
    // \`write_file\` returns a result (\`!\`), it must be checked
    os.write_file('app.log', '
ERROR: log file not found
DEBUG: create new file
DEBUG: write text to log file
ERROR: file not writeable
') or {
        // \`err\` is a special variable that contains the error
        // in \`or {}\` blocks
        eprintln('failed to write the file: \${err}')
        return
    }

    // \`read_file\` returns a result (\`!string\`), it must be checked
    text := os.read_file('app.log') or {
        eprintln('failed to read the file: \${err}')
        return
    }

    // Sse \`clone\` to create a copy of every line, because by default \`split_into_lines\` returns not null terminated strings
    lines := text.trim_spaces().split_into_lines().clone()

    for line in lines {
        if line.starts_with('DEBUG:') {
            println(line)
        }
    }
}

// Output:
// DEBUG: create new file
// DEBUG: write text to log file
`,
        runConfiguration: RunConfigurationType.Run
    },
    {
        name: "Compile-time Reflection",
        code: `
// https://docs.spawnlang.dev/concepts/compile-time/reflection.html
module main

import reflection

struct User {
    name string
    age  i32
}

fn main() {
    data := 'name=Alice\\nage=18'
    user := decode[User](data)
    println(user)
}

fn decode[T: reflection.Struct](data string) -> T {
    mut result := T{}

    // compile-time \`for\` loop
    // T.fields gives an array of a field metadata type
    $for field in T.fields {
        $if field.typ is string {
            // $(string_expr) produces an identifier
            result.$(field.name) = get_string(data, field.name)
        } $else $if field.typ is i32 {
            result.$(field.name) = get_int(data, field.name)
        }
    }

    return result
}

fn get_string(data string, field_name string) -> string {
    for line in data.split_into_lines() {
        key_val := line.split('=')
        if key_val[0] == field_name {
            return key_val[1]
        }
    }

    return ''
}

fn get_int(data string, field string) -> i32 {
    return get_string(data, field).i32()
}

// \`decode[User]\` generates:
// fn decode_User(data string) User {
//     mut result := User{}
//     result.name = get_string(data, 'name')
//     result.age = get_int(data, 'age')
//     return result
// }
`,
        runConfiguration: RunConfigurationType.Run
    },
    {
        name: "Anonymous & higher order functions",
        code: `
// https://docs.spawnlang.dev/concepts/functions/anonymous-and-higher-order-functions.html
module main

fn sqr(n i32) -> i32 {
    return n * n
}

fn cube(n i32) -> i32 {
    return n * n * n
}

fn run(value i32, op fn (n i32) -> i32) -> i32 {
    return op(value)
}

fn main() {
    // Anonymous functions can be called immediately:
    fn () {
        println('Anonymous function')
    }()

    // Functions can be passed to other functions
    println(run(5, sqr)) // "25"

    // Anonymous functions can be declared inside other functions:
    double_fn := fn (n i32) -> i32 {
        return n + n
    }

    println(run(5, double_fn)) // "10"

    // Functions can be passed around without assigning them to variables:
    res := run(5, fn (n i32) -> i32 {
        return n + n
    })

    println(res) // "10"

    // You can even have an array/map of functions:
    fns := [sqr, cube]
    println((fns[0])(10)) // "100"

    fns_map := {
        'sqr':  sqr
        'cube': cube
    }

    println((fns_map['cube'])(2)) // "8"
}
`,
        runConfiguration: RunConfigurationType.Run
    },
    {
        name: "Testing",
        code: `
// Tests in Spawn is very simple.
// To define a test function, use \`test "<test_name_here>" {}\` construction.
// Learn more about testing in the documentation:
// https://docs.spawnlang.dev/concepts/testing.html
module main

test "Hello test" {
    // Inside test functions you can use \`assert\` to check if the result is correct.
    assert hello() == 'Hello world'

    // If the assertion fails, the test will fail.
    // You can provide optional message to \`assert\`:
    assert sum(2, 2) == 4, '2 + 2 should be 4'
}

// Other functions can be used in tests too.
fn hello() -> string {
    return 'Hello world'
}

fn sum(a i32, b i32) -> i32 {
    // oops, this should be \`a + b\`
    return a - b
}
`,
        runConfiguration: RunConfigurationType.Test
    }
].map((example: IExample) => {
    example.code = example.code
        .trim()
        .replace(/^ {4}/gm, "\t") + "\n";

    return example
})

export const codeIfSharedLinkBroken = `
// Oops, the shared link is broken.
// Please recheck the link and try again.
println('Hello, link 404!')
`.trimStart()
