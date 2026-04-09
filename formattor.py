import csv

def fix_csv_directly(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as infile, \
         open(output_file, 'w', newline='', encoding='utf-8') as outfile:
        
        reader = csv.reader(infile)
        writer = csv.writer(outfile, quoting=csv.QUOTE_ALL, quotechar='"')
        
        # Read the header first to determine number of columns
        headers = next(reader)
        headers = [header.strip('"').strip() for header in headers]
        num_columns = len(headers)
        writer.writerow(headers)
        
        for row in reader:
            # Clean each field by stripping whitespace and quotes
            cleaned_row = [field.strip('"').strip() for field in row]
            
            # Ensure the row has the correct number of columns
            if len(cleaned_row) < num_columns:
                # Add "N/A" for missing columns
                cleaned_row.extend(['N/A'] * (num_columns - len(cleaned_row)))
            elif len(cleaned_row) > num_columns:
                # Truncate extra columns (or you could choose to keep them)
                cleaned_row = cleaned_row[:num_columns]
                
            writer.writerow(cleaned_row)

def count_incomplete_rows(input_file):
    with open(input_file, 'r', encoding='utf-8') as infile:
        reader = csv.reader(infile)
        headers = next(reader)  # skip header
        num_columns = len(headers)
        incomplete_count = 0
        
        for row in reader:
            if len(row) < num_columns:
                incomplete_count += 1
                
        return incomplete_count

if __name__ == "__main__":
    input_file = "data/halal_e_numbers_india.csv"  
    output_file = "data/halalIndia_Cleaned.csv"  # Output file path

    # First count how many incomplete rows we have
    incomplete_rows = count_incomplete_rows(input_file)
    print(f"Found {incomplete_rows} incomplete rows in the original file")
    
    # Then process the file
    fix_csv_directly(input_file, output_file)
    
    print(f"CSV file has been fixed and saved to {output_file}")